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

function createValidator(schema) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile(schema);
}

function appendSchemaErrors(validate, errors) {
  if (!validate.errors) return;
  validate.errors.forEach(error => {
    errors.push(`${error.instancePath || '/'} ${error.message}`);
  });
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

function validateUniqueField(records, field, errors, label = field) {
  const seen = new Map();

  records.forEach((record, index) => {
    const value = String(record[field] || '').trim().toLowerCase();
    if (!value) return;

    if (seen.has(value)) {
      errors.push(`${record[field]}: duplicate ${label} also used by record ${seen.get(value) + 1}`);
    } else {
      seen.set(value, index);
    }
  });
}

function validateAiAliases(sites, errors) {
  const seen = new Map();

  sites.forEach(site => {
    const candidates = [site.name, ...(site.search_terms || []), ...(site.aliases || [])];
    candidates.forEach(candidate => {
      const key = String(candidate || '').normalize('NFKC').trim().toLowerCase();
      if (!key) return;

      const owner = seen.get(key);
      if (owner && owner !== site.id) {
        errors.push(`${site.id}: AI alias "${candidate}" is already used by site ${owner}`);
        return;
      }
      seen.set(key, site.id);
    });
  });
}

function validateImage(site, errors) {
  if (!hasText(site.image)) return;

  const publicRoot = path.resolve(ROOT, 'public');
  const imagePath = path.resolve(publicRoot, site.image);
  const isInsidePublic = imagePath === publicRoot || imagePath.startsWith(`${publicRoot}${path.sep}`);
  if (!isInsidePublic || !fs.existsSync(imagePath)) {
    errors.push(`${site.id}: image must resolve to an existing file inside public/: ${site.image}`);
  }
}

function validateTrails(options = {}) {
  const dataPath = options.dataPath || path.join(ROOT, 'data', 'trails.json');
  const schemaPath = options.schemaPath || path.join(ROOT, 'data', 'trails.schema.json');
  const siteIds = options.siteIds || new Set();
  const trails = loadJson(dataPath);
  const schema = loadJson(schemaPath);
  const validate = createValidator(schema);
  const errors = [];

  if (!validate(trails)) appendSchemaErrors(validate, errors);
  validateUniqueField(trails, 'id', errors, 'trail id');

  trails.forEach(trail => {
    const seenStops = new Set();
    (trail.stops || []).forEach(stop => {
      const siteId = String(stop.siteId || '');
      if (siteIds.size && !siteIds.has(siteId)) {
        errors.push(`${trail.id}: unknown siteId ${siteId}`);
      }
      if (seenStops.has(siteId)) {
        errors.push(`${trail.id}: duplicate stop ${siteId}`);
      }
      seenStops.add(siteId);
    });
  });

  return {
    ok: errors.length === 0,
    errors,
    count: trails.length,
  };
}

function validateSites(options = {}) {
  const dataPath = options.dataPath || path.join(ROOT, 'data', 'sites.json');
  const schemaPath = options.schemaPath || path.join(ROOT, 'data', 'sites.schema.json');
  const expectedMainSiteCount = options.expectedMainSiteCount || DEFAULT_MAIN_SITE_COUNT;
  const sites = loadJson(dataPath);
  const schema = loadJson(schemaPath);
  const validate = createValidator(schema);
  const errors = [];

  if (!validate(sites)) appendSchemaErrors(validate, errors);

  validateUniqueField(sites, 'id', errors);
  validateUniqueField(sites, 'name', errors);
  validateAiAliases(sites, errors);

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

  let trailCount = 0;
  if (options.validateTrails !== false) {
    const trailResult = validateTrails({
      dataPath: options.trailDataPath,
      schemaPath: options.trailSchemaPath,
      siteIds: new Set(sites.map(site => String(site.id))),
    });
    trailCount = trailResult.count;
    trailResult.errors.forEach(error => errors.push(`trail: ${error}`));
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      must_visit: counts.must_visit || 0,
      recommended: counts.recommended || 0,
      total: sites.length,
      trails: trailCount,
    },
  };
}

function runCli() {
  const result = validateSites();

  console.log(`Sites: ${result.counts.total} total (${result.counts.must_visit} must_visit, ${result.counts.recommended} recommended)`);
  console.log(`Heritage Threads: ${result.counts.trails}`);

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
  validateTrails,
};
