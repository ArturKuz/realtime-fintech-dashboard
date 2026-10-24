import { GeneratorLoadError } from './generator-load-error';
import { loadGenerator } from './wasm-loader';
import { PRODUCER_ERRORS } from './worker-errors.constants';

const URL_ = 'wasm/generator.wasm';

/** The smallest valid WebAssembly module: magic number + version, no exports. */
const EMPTY_MODULE = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);

const respondWith = (body: BodyInit | null, status = 200) =>
  vi.fn<typeof fetch>(() => Promise.resolve(new Response(body, { status })));

async function loadError(fetchFn: typeof fetch): Promise<GeneratorLoadError> {
  try {
    await loadGenerator(URL_, fetchFn);
  } catch (error) {
    if (error instanceof GeneratorLoadError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected loadGenerator to fail');
}

describe('loadGenerator', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the module from the given URL', async () => {
    const fetchFn = respondWith(EMPTY_MODULE);

    await loadError(fetchFn);

    expect(fetchFn).toHaveBeenCalledWith(URL_);
  });

  it('reports a download failure when the request fails', async () => {
    const fetchFn = vi.fn<typeof fetch>(() => Promise.reject(new TypeError('Failed to fetch')));

    expect((await loadError(fetchFn)).message).toBe(PRODUCER_ERRORS.downloadFailed);
  });

  it('reports a download failure for an error status such as 404', async () => {
    expect((await loadError(respondWith('Not found', 404))).message).toBe(
      PRODUCER_ERRORS.downloadFailed,
    );
  });

  it('reports an invalid module when the bytes are not WebAssembly', async () => {
    expect((await loadError(respondWith('<!doctype html>'))).message).toBe(
      PRODUCER_ERRORS.invalidModule,
    );
  });

  it('reports an invalid module when a valid module lacks the generator exports', async () => {
    expect((await loadError(respondWith(EMPTY_MODULE))).message).toBe(
      PRODUCER_ERRORS.invalidModule,
    );
  });

  it('reports missing WebAssembly support in plain words', async () => {
    vi.stubGlobal('WebAssembly', undefined);

    expect((await loadError(respondWith(EMPTY_MODULE))).message).toBe(PRODUCER_ERRORS.unsupported);
  });
});
