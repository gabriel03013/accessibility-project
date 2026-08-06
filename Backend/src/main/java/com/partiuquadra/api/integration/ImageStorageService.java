package com.partiuquadra.api.integration;

import com.partiuquadra.api.config.MediaProperties;
import com.partiuquadra.api.dto.MediaDtos;
import com.partiuquadra.api.exception.ApiException;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageStorageService {

    private static final Map<String, String> EXTENSIONS = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png");

    private final MediaProperties properties;

    public ImageStorageService(MediaProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    void initializeStorage() throws IOException {
        Files.createDirectories(properties.storagePath());
    }

    public MediaDtos.UploadView store(MultipartFile file) {
        validateFile(file);
        String contentType = normalizeContentType(file.getContentType());
        ImageSize size = readImageSize(file);
        String storageKey = UUID.randomUUID() + EXTENSIONS.get(contentType);
        Path target = resolve(storageKey);
        Path temporary = resolve(storageKey + ".uploading");

        try (InputStream input = file.getInputStream()) {
            Files.copy(input, temporary, StandardCopyOption.REPLACE_EXISTING);
            Files.move(
                    temporary,
                    target,
                    StandardCopyOption.ATOMIC_MOVE,
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            deleteQuietly(temporary);
            throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "IMAGE_STORAGE_UNAVAILABLE",
                    "Não foi possível salvar a foto agora.");
        }

        return new MediaDtos.UploadView(
                storageKey,
                "/api/v1/media/images/" + storageKey,
                contentType,
                size.width(),
                size.height());
    }

    public StoredImage load(String storageKey) {
        if (!storageKey.matches("^[a-f0-9-]{36}\\.(jpg|png)$")) {
            throw notFound();
        }

        Path path = resolve(storageKey);
        if (!Files.isRegularFile(path)) {
            throw notFound();
        }

        try {
            Resource resource = new UrlResource(path.toUri());
            String contentType = storageKey.endsWith(".png") ? "image/png" : "image/jpeg";
            return new StoredImage(resource, contentType);
        } catch (IOException exception) {
            throw notFound();
        }
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalidImage("Selecione uma foto válida.");
        }
        if (file.getSize() > properties.maxFileSize()) {
            throw invalidImage("A foto deve ter no máximo 8 MB.");
        }
        if (!EXTENSIONS.containsKey(normalizeContentType(file.getContentType()))) {
            throw invalidImage("Use uma foto em formato JPEG ou PNG.");
        }
    }

    private ImageSize readImageSize(MultipartFile file) {
        String expectedFormat = "image/png".equals(normalizeContentType(file.getContentType()))
                ? "png"
                : "jpeg";
        try (InputStream input = file.getInputStream();
                ImageInputStream imageInput = ImageIO.createImageInputStream(input)) {
            if (imageInput == null) {
                throw invalidImage("O arquivo enviado não é uma foto válida.");
            }
            var readers = ImageIO.getImageReaders(imageInput);
            if (!readers.hasNext()) {
                throw invalidImage("O arquivo enviado não é uma foto válida.");
            }
            ImageReader reader = readers.next();
            try {
                reader.setInput(imageInput, true, true);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!format.equals(expectedFormat)
                        && !("jpeg".equals(expectedFormat) && "jpg".equals(format))) {
                    throw invalidImage("O formato real da foto não corresponde ao arquivo enviado.");
                }
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                long pixels = Math.multiplyExact((long) width, height);
                if (width < 320 || height < 240 || pixels > properties.maxPixels()) {
                    throw invalidImage("Use uma foto entre 320 × 240 e 25 megapixels.");
                }
                return new ImageSize(width, height);
            } finally {
                reader.dispose();
            }
        } catch (ArithmeticException | IOException exception) {
            throw invalidImage("O arquivo enviado não é uma foto válida.");
        }
    }

    private String normalizeContentType(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).trim();
    }

    private Path resolve(String storageKey) {
        Path path = properties.storagePath().resolve(storageKey).normalize();
        if (!path.startsWith(properties.storagePath())) {
            throw invalidImage("O arquivo enviado não é válido.");
        }
        return path;
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
        }
    }

    private ApiException invalidImage(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_IMAGE", message);
    }

    private ApiException notFound() {
        return new ApiException(
                HttpStatus.NOT_FOUND,
                "IMAGE_NOT_FOUND",
                "Esta foto não está disponível.");
    }

    private record ImageSize(int width, int height) {
    }

    public record StoredImage(Resource resource, String contentType) {
    }
}
