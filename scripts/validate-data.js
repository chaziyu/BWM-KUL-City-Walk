const fs = require('fs');
const path = require('path');
const Ajv = require('ajv/dist/2020');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_MAIN_SITE_COUNT = 11;

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateQuiz(site, errors) {
  if (!site.quiz) {
    if (site.category === 'must_visit') {
      errors.push(`${site.id}: must_visit sites require a quiz`);
    }
    return;
  }

  const question = site.quiz.question || site.quiz.q;
  const answer = site.quiz.answer || site.quiz.a;
  const { options } = site.quiz;
  if (!hasText(question)) errors.push(`${site.id}: quiz.question is required`);
  if (!hasText(answer)) errors.push(`${site.id}: quiz.answer is required`);
  if (!Array.isArray(options) || options.length < 2) {
    errors.push(`${site.id}: quiz.options must contain at least two options`);
    return;
  }

  const normalisedOptions = options.map(option => String(option).trim().toLowerCase());
  const normalisedAnswer = String(answer).trim().toLowerCase();
  if (!normalisedOptions.includes(normalisedAnswer)) {
    errors.push(`${site.id}: quiz.answer must match one of quiz.options`);
  }
}

function validateUniqueField(sites, field, errors) {
  const seen = new Map();

  sites.forEach((site, index) => {
    const value = String(site[field] || '').trim().toLowerCase();
    if (!value) return;

    if (seen.has(value)) {
      errors.push(`${site[field]}: duplicate ${field} also used by record ${seen.get(value) + 1}`);
    } else {
      seen.set(value, index);
    }
  });
}

function validateImage(site, errors) {
  if (!hasText(site.image)) return;

  const imagePath = path.resolve(ROOT, 'public', site.image);
  if (!imagePath.startsWith(ROOT) || !fs.existsSync(imagePath)) {
    errors.push(`${site.id}: image does not exist at ${site.image}`);
  }
}

function validateSites(options = {}) {
  const dataPath = options.dataPath || path.join(ROOT, 'data', 'sites.json');
  const schemaPath = options.schemaPath || path.join(ROOT, 'data', 'sites.schema.json');
  const expectedMainSiteCount = options.expectedMainSiteCount || DEFAULT_MAIN_SITE_COUNT;
  const sites = loadJson(dataPath);
  const schema = loadJson(schemaPath);

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const errors = [];

  if (!validate(sites)) {
    validate.errors.forEach(error => {
      errors.push(`${error.instancePath || '/'} ${error.message}`);
    });
  }

  validateUniqueField(sites, 'id', errors);
  validateUniqueField(sites, 'name', errors);

  sites.forEach(site => {
    validateImage(site, errors);
    validateQuiz(site, errors);

    if (site.category === 'must_visit' && !hasText(site.ai_context)) {
      errors.push(`${site.id}: must_visit sites require ai_context`);
    }
  });

  const counts = sites.reduce((result, site) => {
    result[site.category] = (result[site.category] || 0) + 1;
    return result;
  }, {});

  if ((counts.must_visit || 0) !== expectedMainSiteCount) {
    errors.push(`Expected ${expectedMainSiteCount} must_visit sites, found ${counts.must_visit || 0}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      must_visit: counts.must_visit || 0,
      recommended: counts.recommended || 0,
      total: sites.length,
    },
  };
}

function runCli() {
  const result = validateSites();

  console.log(`Sites: ${result.counts.total} total (${result.counts.must_visit} must_visit, ${result.counts.recommended} recommended)`);

  if (!result.ok) {
    console.error('Data validation failed:');
    result.errors.forEach(error => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log('Data validation passed.');
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  validateSites,
};
