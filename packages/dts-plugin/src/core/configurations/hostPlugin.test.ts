import { describe, expect, it } from 'vitest';
import path from 'path';

import { retrieveHostConfig } from './hostPlugin';
import { retrieveTypesArchiveDestinationPath } from '../lib/archiveHandler';

describe('hostPlugin', () => {
  const moduleFederationConfig = {
    name: 'hostPluginTestHost',
    filename: 'remoteEntry.js',
    remotes: {
      moduleFederationTypescript: 'http://localhost:3000/remoteEntry.js',
    },
    shared: {
      react: { singleton: true, eager: true },
      'react-dom': { singleton: true, eager: true },
    },
  };

  describe('retrieveHostConfig', () => {
    it('throws for missing module federation configuration', () => {
      // @ts-expect-error Missing module federation configuration
      const invokeRetrieve = () => retrieveHostConfig({});
      expect(invokeRetrieve).toThrowError('moduleFederationConfig is required');
    });

    describe('correctly intersect with default options', () => {
      it('only moduleFederationConfig provided', () => {
        const { hostOptions, mapRemotesToDownload } = retrieveHostConfig({
          moduleFederationConfig,
        });

        expect(hostOptions).toStrictEqual({
          moduleFederationConfig,
          typesFolder: '@mf-types',
          remoteTypesFolder: '@mf-types',
          deleteTypesFolder: true,
          maxRetries: 3,
          implementation: '',
          context: process.cwd(),
          abortOnError: true,
          consumeAPITypes: false,
          runtimePkgs: [],
          remoteTypeUrls: {},
          timeout: 60000,
          typesOnBuild: false,
        });

        expect(mapRemotesToDownload).toStrictEqual({
          moduleFederationTypescript: {
            alias: 'moduleFederationTypescript',
            apiTypeUrl: 'http://localhost:3000/@mf-types.d.ts',
            name: 'http://localhost:3000/remoteEntry.js',
            url: 'http://localhost:3000/remoteEntry.js',
            zipUrl: 'http://localhost:3000/@mf-types.zip',
          },
        });
      });

      it('all options provided', () => {
        const options = {
          moduleFederationConfig,
          typesFolder: 'custom-types',
          remoteTypesFolder: '@remote-mf-types',
          deleteTypesFolder: false,
          maxRetries: 1,
          implementation: '',
          context: process.cwd(),
          abortOnError: true,
          consumeAPITypes: false,
          runtimePkgs: [],
          remoteTypeUrls: {},
          timeout: 60000,
          typesOnBuild: false,
        };

        const { hostOptions, mapRemotesToDownload } =
          retrieveHostConfig(options);

        expect(hostOptions).toStrictEqual(options);

        expect(mapRemotesToDownload).toStrictEqual({
          moduleFederationTypescript: {
            alias: 'moduleFederationTypescript',
            apiTypeUrl: 'http://localhost:3000/@remote-mf-types.d.ts',
            name: 'http://localhost:3000/remoteEntry.js',
            url: 'http://localhost:3000/remoteEntry.js',
            zipUrl: 'http://localhost:3000/@remote-mf-types.zip',
          },
        });

        const destinationPath = path.resolve(
          hostOptions.context,
          hostOptions.typesFolder,
          'moduleFederationTypescript',
        );
        expect(
          retrieveTypesArchiveDestinationPath(
            hostOptions,
            'moduleFederationTypescript',
          ),
        ).toStrictEqual(destinationPath);
      });
    });

    it('correctly resolve subpath remotes', () => {
      const subpathModuleFederationConfig = {
        ...moduleFederationConfig,
        remotes: {
          moduleFederationTypescript:
            'http://localhost:3000/subpatha/subpathb/remoteEntry.js',
        },
      };

      const { mapRemotesToDownload } = retrieveHostConfig({
        moduleFederationConfig: subpathModuleFederationConfig,
      });

      expect(mapRemotesToDownload).toStrictEqual({
        moduleFederationTypescript: {
          alias: 'moduleFederationTypescript',
          apiTypeUrl: 'http://localhost:3000/subpatha/subpathb/@mf-types.d.ts',
          name: 'http://localhost:3000/subpatha/subpathb/remoteEntry.js',
          url: 'http://localhost:3000/subpatha/subpathb/remoteEntry.js',
          zipUrl: 'http://localhost:3000/subpatha/subpathb/@mf-types.zip',
        },
      });
    });

    it('correctly resolve remotes with relative reference in place of absolute url', () => {
      const subpathModuleFederationConfig = {
        ...moduleFederationConfig,
        remotes: {
          moduleFederationTypescript: '/subpatha/mf-manifest.json',
        },
      };

      const { mapRemotesToDownload } = retrieveHostConfig({
        moduleFederationConfig: subpathModuleFederationConfig,
      });

      expect(mapRemotesToDownload).toStrictEqual({
        moduleFederationTypescript: {
          alias: 'moduleFederationTypescript',
          apiTypeUrl: '/subpatha/@mf-types.d.ts',
          name: '/subpatha/mf-manifest.json',
          url: '/subpatha/mf-manifest.json',
          zipUrl: '/subpatha/@mf-types.zip',
        },
      });
    });

    it('correctly resolve remoteTypeUrls', () => {
      const mfConfigWithRemoteTypeUrls = {
        ...moduleFederationConfig,
        remotes: {
          'remote1-alias': 'remote1@http://localhost:3001/remoteEntry.js',
          'remote2-alias': 'remote2@http://localhost:3002/remoteEntry.js',
        },
      };

      const { mapRemotesToDownload } = retrieveHostConfig({
        moduleFederationConfig: mfConfigWithRemoteTypeUrls,
        remoteTypeUrls: {
          remote1: {
            alias: 'remote1-alias',
            zip: 'http://localhost:3001/custom-dir/@mf-types.zip',
            api: 'http://localhost:3001/custom-dir/@mf-types.d.ts',
          },
        },
      });

      expect(mapRemotesToDownload).toStrictEqual({
        'remote1-alias': {
          name: 'remote1',
          alias: 'remote1-alias',
          url: 'http://localhost:3001/remoteEntry.js',
          zipUrl: 'http://localhost:3001/custom-dir/@mf-types.zip',
          apiTypeUrl: 'http://localhost:3001/custom-dir/@mf-types.d.ts',
        },
        'remote2-alias': {
          name: 'remote2',
          alias: 'remote2-alias',
          url: 'http://localhost:3002/remoteEntry.js',
          zipUrl: 'http://localhost:3002/@mf-types.zip',
          apiTypeUrl: 'http://localhost:3002/@mf-types.d.ts',
        },
      });
    });

    it('throw error if typeof remoteTypeUrls is not object', () => {
      const options = {
        moduleFederationConfig,
        remoteTypeUrls: () =>
          Promise.resolve({
            remote1: {
              alias: 'remote1-alias',
              zip: 'http://localhost:3001/custom-dir/@mf-types.zip',
              api: 'http://localhost:3001/custom-dir/@mf-types.d.ts',
            },
          }),
      };

      const invokeRetrieve = () => retrieveHostConfig(options);
      expect(invokeRetrieve).toThrowError(
        'remoteTypeUrls must be consumed before resolveRemotes',
      );
    });
  });
});
