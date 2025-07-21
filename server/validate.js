const Ajv = require("ajv");
const schema = require("../serviceConfigSchema.json");

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

exports.validateConfig = (config) => {
  const valid = validate(config);
  return valid
    ? { valid: true }
    : { valid: false, error: ajv.errorsText(validate.errors) };
};
