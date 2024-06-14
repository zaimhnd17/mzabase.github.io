
window.tinyMceInitConf = {
    height: 500,
	toolbar: 'undo redo | styleselect | forecolor backcolor | bold italic underline | alignleft aligncenter alignright alignjustify | outdent indent | numlist bullist | link image | removeformat | code',
    plugins: 'lists link image imagetools table code paste preview',
    table_style_by_css: true,
    table_default_attributes: {},
	images_file_types: 'jpg,jpeg,png,gif',
	file_picker_types: 'image',
	paste_data_images: true,
	automatic_uploads: false,
    file_picker_callback: function (cb, value, meta) {
        var input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');

        input.onchange = function () {
            var file = this.files[0];

            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                var id = 'blobid' + (new Date()).getTime();
                var blobCache = tinymce.activeEditor.editorUpload.blobCache;
                var base64 = reader.result.split(',')[1];
                var blobInfo = blobCache.create(id, file, base64);
                blobCache.add(blobInfo);
                cb(blobInfo.blobUri(), { title: file.name });
            };
        };
        input.click();
    },
    images_upload_handler: function (blobInfo, success, failure, progress) {
        var xhr, formData;
        console.log('Uploading \'' + blobInfo.filename() + '\' via images_upload_handler ...');

        xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('POST', 'api/v1/artikel/uploadimage');
        xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem('authToken').replace(/['"]+/g, ''))

        xhr.upload.onprogress = function (e) {
            progress(e.loaded / e.total * 100);
        };
        xhr.onload = function () {
            var json;

            if (xhr.status === 403) {
                failure('HTTP Error: ' + xhr.status, { remove: true });
                return;
            }

            if (xhr.status < 200 || xhr.status >= 300) {
                failure('HTTP Error: ' + xhr.status);
                return;
            }

            json = JSON.parse(xhr.responseText);

            if (!json || typeof json.location !== 'string') {
                failure('Invalid JSON: ' + xhr.responseText);
                return;
            }

            console.log('\'' + blobInfo.filename() + '\' uploaded successfuly and saved as \'' + json.location + '\'.');
            success(json.location);
        };
        xhr.onerror = function () {
            failure('Image upload failed due to a XHR Transport error. Code: ' + xhr.status);
        };

        formData = new FormData();
        formData.append('file', blobInfo.blob(), blobInfo.filename());
        xhr.send(formData);
    }
}