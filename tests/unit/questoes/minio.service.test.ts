import { MinioService } from "../../../src/modules/questoes/minio.service";
import * as Minio from "minio";

jest.mock("minio");

describe("MinioService", () => {
  let service: MinioService;
  let mockMinioClient: {
    putObject: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    process.env.MINIO_ENDPOINT = "http://localhost";
    process.env.MINIO_API_PORT = "9000";
    process.env.NODE_ENV = "development";
    process.env.MINIO_ROOT_USER = "user";
    process.env.MINIO_ROOT_PASSWORD = "password";

    mockMinioClient = {
      putObject: jest.fn().mockResolvedValue(null),
    };

    (Minio.Client as unknown as jest.Mock).mockImplementation(() => mockMinioClient);

    service = new MinioService();
  });

  it("deve ser instanciado corretamente", () => {
    expect(service).toBeDefined();
    expect(Minio.Client).toHaveBeenCalled();
  });

  describe("uploadImagem", () => {
    it("deve formatar o nome do arquivo e chamar o putObject com os parâmetros corretos", async () => {
      const mockDate = 123456789;
      jest.spyOn(Date, "now").mockReturnValue(mockDate);

      const mockFile = {
        originalname: "teste imagem.png",
        buffer: Buffer.from("conteudo-fake"),
        size: 1024,
        mimetype: "image/png",
      } as unknown as Express.Multer.File;

      const nomeEsperado = `${mockDate}-teste_imagem.png`;
      const urlEsperada = "http://localhost:9000/anatoquizup-imagens/" + nomeEsperado;

      const resultado = await service.uploadImagem(mockFile);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        "anatoquizup-imagens",
        nomeEsperado,
        mockFile.buffer,
        mockFile.size,
        { "Content-Type": "image/png" },
      );

      expect(resultado).toBe(urlEsperada);
    });
  });

  describe("gerarUrlPublica", () => {
    it("deve gerar URL sem porta quando estiver em produção", async () => {
      process.env.NODE_ENV = "production";
      process.env.MINIO_ENDPOINT = "https://s3.meudominio.com";

      const mockFile = {
        originalname: "foto.jpg",
        buffer: Buffer.from(""),
        size: 0,
        mimetype: "image/jpeg",
      } as unknown as Express.Multer.File;

      const resultado = await service.uploadImagem(mockFile);

      expect(resultado).toContain("https://s3.meudominio.com/anatoquizup-imagens/");
      expect(resultado).not.toContain(":9000");
    });
  });
});
