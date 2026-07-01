const DISPLAY_MODEL_SCHEMA_VERSION = 2;

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const fail = (reason) => {
  throw new Error(`invalid_server_display_model:${reason}`);
};

export const validateServerDisplayModel = (model) => {
  if (!isPlainObject(model)) fail('model');
  if (model.schemaVersion !== DISPLAY_MODEL_SCHEMA_VERSION) {
    throw new Error(`unsupported_server_display_model:${model.schemaVersion || 'missing'}`);
  }
  if (!model.resultId || !/^[A-Za-z0-9-]+$/.test(model.resultId)) fail('result_id');
  if (!/^[EISNTFJP]{4}$/.test(model.mbti || '')) fail('mbti');
  if (!isPlainObject(model.info)) fail('info');
  if (!isPlainObject(model.spirit) || (!model.spirit.asset && !model.spirit.assetKey)) fail('spirit');
  if (model.spirit.assetKey && model.spirit.assetKey !== model.mbti) fail('spirit_asset_key');
  if (!isPlainObject(model.presentation)) fail('presentation');
  if (!isPlainObject(model.shareCardCopy)) fail('share_card_copy');
  if (!isPlainObject(model.currentEntry) || !model.currentEntry.localEntryId || !model.currentEntry.createdAt) {
    fail('current_entry');
  }
  if (!Array.isArray(model.spectrum) || model.spectrum.length !== 4) fail('spectrum');
  if (!Array.isArray(model.presentationThemes) || model.presentationThemes.length < 1) fail('presentation_themes');
  return model;
};

export { DISPLAY_MODEL_SCHEMA_VERSION };
