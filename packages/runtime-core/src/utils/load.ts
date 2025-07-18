import {
  loadScript,
  loadScriptNode,
  composeKeyWithSeparator,
  isBrowserEnv,
} from '@module-federation/sdk';
import { DEFAULT_REMOTE_TYPE, DEFAULT_SCOPE } from '../constant';
import { ModuleFederation } from '../core';
import { globalLoading, getRemoteEntryExports } from '../global';
import { Remote, RemoteEntryExports, RemoteInfo } from '../type';
import { assert } from './logger';
import {
  RUNTIME_001,
  RUNTIME_008,
  getShortErrorMsg,
  runtimeDescMap,
} from '@module-federation/error-codes';

// Declare the ENV_TARGET constant that will be defined by DefinePlugin
declare const ENV_TARGET: 'web' | 'node';
const importCallback = '.then(callbacks[0]).catch(callbacks[1])';

async function loadEsmEntry({
  entry,
  remoteEntryExports,
}: {
  entry: string;
  remoteEntryExports: RemoteEntryExports | undefined;
}): Promise<RemoteEntryExports> {
  return new Promise<RemoteEntryExports>((resolve, reject) => {
    try {
      if (!remoteEntryExports) {
        if (typeof FEDERATION_ALLOW_NEW_FUNCTION !== 'undefined') {
          new Function('callbacks', `import("${entry}")${importCallback}`)([
            resolve,
            reject,
          ]);
        } else {
          import(/* webpackIgnore: true */ /* @vite-ignore */ entry)
            .then(resolve)
            .catch(reject);
        }
      } else {
        resolve(remoteEntryExports);
      }
    } catch (e) {
      reject(e);
    }
  });
}

async function loadSystemJsEntry({
  entry,
  remoteEntryExports,
}: {
  entry: string;
  remoteEntryExports: RemoteEntryExports | undefined;
}): Promise<RemoteEntryExports> {
  return new Promise<RemoteEntryExports>((resolve, reject) => {
    try {
      if (!remoteEntryExports) {
        //@ts-ignore
        if (typeof __system_context__ === 'undefined') {
          //@ts-ignore
          System.import(entry).then(resolve).catch(reject);
        } else {
          new Function(
            'callbacks',
            `System.import("${entry}")${importCallback}`,
          )([resolve, reject]);
        }
      } else {
        resolve(remoteEntryExports);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function handleRemoteEntryLoaded(
  name: string,
  globalName: string,
  entry: string,
): RemoteEntryExports {
  const { remoteEntryKey, entryExports } = getRemoteEntryExports(
    name,
    globalName,
  );

  assert(
    entryExports,
    getShortErrorMsg(RUNTIME_001, runtimeDescMap, {
      remoteName: name,
      remoteEntryUrl: entry,
      remoteEntryKey,
    }),
  );

  return entryExports;
}

async function loadEntryScript({
  name,
  globalName,
  entry,
  loaderHook,
}: {
  name: string;
  globalName: string;
  entry: string;
  loaderHook: ModuleFederation['loaderHook'];
}): Promise<RemoteEntryExports> {
  const { entryExports: remoteEntryExports } = getRemoteEntryExports(
    name,
    globalName,
  );

  if (remoteEntryExports) {
    return remoteEntryExports;
  }

  return loadScript(entry, {
    attrs: {},
    createScriptHook: (url, attrs) => {
      const res = loaderHook.lifecycle.createScript.emit({ url, attrs });

      if (!res) return;

      if (res instanceof HTMLScriptElement) {
        return res;
      }

      if ('script' in res || 'timeout' in res) {
        return res;
      }

      return;
    },
  })
    .then(() => {
      return handleRemoteEntryLoaded(name, globalName, entry);
    })
    .catch((e) => {
      assert(
        undefined,
        getShortErrorMsg(RUNTIME_008, runtimeDescMap, {
          remoteName: name,
          resourceUrl: entry,
        }),
      );
      throw e;
    });
}

async function loadEntryDom({
  remoteInfo,
  remoteEntryExports,
  loaderHook,
}: {
  remoteInfo: RemoteInfo;
  remoteEntryExports?: RemoteEntryExports;
  loaderHook: ModuleFederation['loaderHook'];
}) {
  const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
  switch (type) {
    case 'esm':
    case 'module':
      return loadEsmEntry({ entry, remoteEntryExports });
    case 'system':
      return loadSystemJsEntry({ entry, remoteEntryExports });
    default:
      return loadEntryScript({ entry, globalName, name, loaderHook });
  }
}

async function loadEntryNode({
  remoteInfo,
  loaderHook,
}: {
  remoteInfo: RemoteInfo;
  loaderHook: ModuleFederation['loaderHook'];
}) {
  const { entry, entryGlobalName: globalName, name, type } = remoteInfo;
  const { entryExports: remoteEntryExports } = getRemoteEntryExports(
    name,
    globalName,
  );

  if (remoteEntryExports) {
    return remoteEntryExports;
  }

  return loadScriptNode(entry, {
    attrs: { name, globalName, type },
    loaderHook: {
      createScriptHook: (url: string, attrs: Record<string, any> = {}) => {
        const res = loaderHook.lifecycle.createScript.emit({ url, attrs });

        if (!res) return;

        if ('url' in res) {
          return res;
        }

        return;
      },
    },
  })
    .then(() => {
      return handleRemoteEntryLoaded(name, globalName, entry);
    })
    .catch((e) => {
      throw e;
    });
}

export function getRemoteEntryUniqueKey(remoteInfo: RemoteInfo): string {
  const { entry, name } = remoteInfo;
  return composeKeyWithSeparator(name, entry);
}

export async function getRemoteEntry({
  origin,
  remoteEntryExports,
  remoteInfo,
}: {
  origin: ModuleFederation;
  remoteInfo: RemoteInfo;
  remoteEntryExports?: RemoteEntryExports | undefined;
}): Promise<RemoteEntryExports | false | void> {
  const uniqueKey = getRemoteEntryUniqueKey(remoteInfo);
  if (remoteEntryExports) {
    return remoteEntryExports;
  }

  if (!globalLoading[uniqueKey]) {
    const loadEntryHook = origin.remoteHandler.hooks.lifecycle.loadEntry;
    const loaderHook = origin.loaderHook;

    globalLoading[uniqueKey] = loadEntryHook
      .emit({
        loaderHook,
        remoteInfo,
        remoteEntryExports,
      })
      .then((res) => {
        if (res) {
          return res;
        }
        // Use ENV_TARGET if defined, otherwise fallback to isBrowserEnv, must keep this
        const isWebEnvironment =
          typeof ENV_TARGET !== 'undefined'
            ? ENV_TARGET === 'web'
            : isBrowserEnv();

        return isWebEnvironment
          ? loadEntryDom({ remoteInfo, remoteEntryExports, loaderHook })
          : loadEntryNode({ remoteInfo, loaderHook });
      });
  }

  return globalLoading[uniqueKey];
}

export function getRemoteInfo(remote: Remote): RemoteInfo {
  return {
    ...remote,
    entry: 'entry' in remote ? remote.entry : '',
    type: remote.type || DEFAULT_REMOTE_TYPE,
    entryGlobalName: remote.entryGlobalName || remote.name,
    shareScope: remote.shareScope || DEFAULT_SCOPE,
  };
}
