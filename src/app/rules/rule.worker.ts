/// <reference lib="webworker" />

interface RuleWorkerParams {
  script: string,
  fileName: string,
  fileContent: string,
}

interface Data {
  data: RuleWorkerParams
}

addEventListener('message', ({data}: Data) => {
  const result = Function("const fileName = arguments[0]; const fileContent = arguments[1]; " + data.script)(data.fileName, data.fileContent);
  postMessage(result);
});
