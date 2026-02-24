using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace ConnectUS.API.Services
{
    public interface ICloudinaryService
    {
        Task<ImageUploadResult> UploadImageAsync(IFormFile file);
        Task<VideoUploadResult> UploadVideoAsync(IFormFile file);
        Task<RawUploadResult> UploadFileAsync(IFormFile file);
        Task<DeletionResult> DeleteFileAsync(string publicId);
    }

    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var account = new Account(
                config["Cloudinary:CloudName"] ?? "dj0vncxox",
                config["Cloudinary:ApiKey"] ?? "263389988156442",
                config["Cloudinary:ApiSecret"] ?? "ffSeWb-tWJANdLH4dDD3JsLJBak"
            );
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
        }

        public async Task<ImageUploadResult> UploadImageAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "connectus/images",
                Transformation = new Transformation().Quality("auto").FetchFormat("auto")
            };
            return await _cloudinary.UploadAsync(uploadParams);
        }

        public async Task<VideoUploadResult> UploadVideoAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            var uploadParams = new VideoUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "connectus/videos"
            };
            return await _cloudinary.UploadAsync(uploadParams);
        }

        public async Task<RawUploadResult> UploadFileAsync(IFormFile file)
        {
            using var stream = file.OpenReadStream();
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "connectus/files"
            };
            return await _cloudinary.UploadAsync(uploadParams);
        }

        public async Task<DeletionResult> DeleteFileAsync(string publicId)
        {
            var deleteParams = new DeletionParams(publicId);
            return await _cloudinary.DestroyAsync(deleteParams);
        }
    }
}
