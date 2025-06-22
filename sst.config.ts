/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "list-event-jjp-api",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Function("Api", {
      handler: "api/index.handler",
      url: true,
      environment: {
        KEY: process.env.KEY!,
        SPREADSHEET_ID: process.env.SPREADSHEET_ID!,
      },
    });
  }
});