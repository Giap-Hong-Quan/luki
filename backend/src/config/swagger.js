import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API HOAN",
      version: "1.0.0",
      description: "Xem chi tiết các API của dự án HOAN",
    },
    servers: [
      {
        url: "http://localhost:8000/api",
        description: "Local server",
      },
    ],

    // ✅ BẮT BUỘC: khai báo bearerAuth
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  // nơi swagger đọc comment
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

export const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log("Swagger chạy tại: http://localhost:8000/api-docs");
};
