/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra and Zackary Jackson @ScriptedAlchemy
*/

'use strict';
import type { Compiler } from 'webpack';
import { isRequiredVersion } from '@module-federation/sdk';
import { parseOptions } from '../container/options';
import ConsumeSharedPlugin from './ConsumeSharedPlugin';
import ProvideSharedPlugin from './ProvideSharedPlugin';
import type {
  SharePluginOptions,
  SharedConfig,
} from '../../declarations/plugins/sharing/SharePlugin';
import type { ConsumesConfig } from '../../declarations/plugins/sharing/ConsumeSharedPlugin';
import type { ProvidesConfig } from '../../declarations/plugins/sharing/ProvideSharedPlugin';
import { getWebpackPath } from '@module-federation/sdk/normalize-webpack-path';

class SharePlugin {
  private _shareScope: string | string[];
  private _consumes: Record<string, ConsumesConfig>[];
  private _provides: Record<string, ProvidesConfig>[];

  constructor(options: SharePluginOptions) {
    const sharedOptions: [string, SharedConfig][] = parseOptions(
      options.shared,
      (item, key) => {
        if (typeof item !== 'string')
          throw new Error('Unexpected array in shared');
        const config: SharedConfig =
          item === key || !isRequiredVersion(item)
            ? {
                import: item,
              }
            : {
                import: key,
                requiredVersion: item,
              };
        return config;
      },
      (item) => item,
    );
    const consumes: Record<string, ConsumesConfig>[] = sharedOptions.map(
      ([key, options]) => ({
        [key]: {
          import: options.import,
          shareKey: options.shareKey || key,
          shareScope: options.shareScope,
          requiredVersion: options.requiredVersion,
          strictVersion: options.strictVersion,
          singleton: options.singleton,
          packageName: options.packageName,
          eager: options.eager,
          issuerLayer: options.issuerLayer,
          layer: options.layer,
          request: options.request || key,
          include: options.include,
          exclude: options.exclude,
        },
      }),
    );
    const provides: Record<string, ProvidesConfig>[] = sharedOptions
      .filter(([, options]) => options.import !== false)
      .map(([key, options]) => ({
        [options.import || key]: {
          shareKey: options.shareKey || key,
          shareScope: options.shareScope,
          version: options.version,
          eager: options.eager,
          requiredVersion: options.requiredVersion,
          strictVersion: options.strictVersion,
          singleton: options.singleton,
          layer: options.layer,
          request: options.request || options.import || key,
          include: options.include,
          exclude: options.exclude,
        },
      }));

    this._shareScope = options.shareScope || 'default';
    this._consumes = consumes;
    this._provides = provides;
  }

  /**
   * Applies the plugin to the webpack compiler instance
   * @param compiler - The webpack compiler instance
   */
  apply(compiler: Compiler): void {
    process.env['FEDERATION_WEBPACK_PATH'] =
      process.env['FEDERATION_WEBPACK_PATH'] || getWebpackPath(compiler);

    new ConsumeSharedPlugin({
      shareScope: this._shareScope,
      consumes: this._consumes,
    }).apply(compiler);
    new ProvideSharedPlugin({
      shareScope: this._shareScope,
      provides: this._provides,
    }).apply(compiler);
  }
}

export default SharePlugin;
