'use strict';

const fs = require('fs');
const assert = require('assert');
const mm = require('mm');
const path = require('path');
const mockCnpmrc = path.join(__dirname, './fixtures/auth/');
if (!fs.existsSync(mockCnpmrc + '.cnpmrc')) {
  fs.writeFileSync(mockCnpmrc + '.cnpmrc', 'registry=https://registry-mock.org/\n//registry-mock.org/:always-auth=true\n//registry-mock.org/:_password="bW9jaw=="\n//registry-mock.org/:username=hyj19911120');
}
mm(process.env, 'HOME', mockCnpmrc);
mm(process.env, 'USERPROFILE', mockCnpmrc);
// clean cnpm_config.js cache
delete require.cache[require.resolve('../lib/get')];
delete require.cache[require.resolve('../lib/cnpm_config')];
const get = require('../lib/get');
mm.restore();

describe('test/get.test.js', () => {
  it('should retry on JSON parse error', async () => {
    const logger = {
      warn(msg) {
        assert(msg.includes('[npminstall:get] retry GET'));
      },
    };
    try {
      await get('https://npmmirror.com', { dataType: 'json' }, { console: logger });
      assert(false, 'should not run this');
    } catch (err) {
      assert(err.name === 'JSONResponseFormatError');
      assert(err.res.requestUrls.length > 0);
    }
  });

  it('should set auth info into header', async () => {
    const logger = {
      warn(msg) {
        assert(msg.includes('[npminstall:get] retry GET'));
      },
    };
    const options = { dataType: 'json' };
    assert(fs.existsSync(mockCnpmrc + '.cnpmrc'));
    try {
      await get('https://registry-mock.org/mock', options, { console: logger });
      assert(false, 'should not run this');
    } catch (err) {
      console.error(err);
      const headers = options.headers;
      assert(headers.Authorization);
      assert(err.message.includes('ENOTFOUND') || err.message.includes('Connect Timeout Error'));
      assert(err.res.requestUrls.length > 0);
    }
  });
});
