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
    const SPREADSHEET_ID = new sst.Secret("SPREADSHEET_ID");
    const KEY = new sst.Secret("KEY");


    new sst.aws.Function("Api", {
      handler: "api/index.handler",
      url: true,
      environment: {
        SPREADSHEET_ID: SPREADSHEET_ID.value,
        KEY: KEY.value,
      },
    });
  }
});