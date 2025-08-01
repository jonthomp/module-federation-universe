// @ts-nocheck
/* eslint-disable */
/*
 * This file was automatically generated.
 * DO NOT MODIFY BY HAND.
 */

export default {
  definitions: {
    Shared: {
      description:
        'Modules that should be shared in the share scope. When provided, property names are used to match requested modules in this compilation.',
      anyOf: [
        {
          type: 'array',
          items: {
            description: 'Modules that should be shared in the share scope.',
            anyOf: [
              {
                $ref: '#/definitions/SharedItem',
              },
              {
                $ref: '#/definitions/SharedObject',
              },
            ],
          },
        },
        {
          $ref: '#/definitions/SharedObject',
        },
      ],
    },
    SharedConfig: {
      description:
        'Advanced configuration for modules that should be shared in the share scope.',
      type: 'object',
      additionalProperties: false,
      properties: {
        eager: {
          description:
            'Include the provided and fallback module directly instead behind an async request. This allows to use this shared module in initial load too. All possible shared modules need to be eager too.',
          type: 'boolean',
        },
        exclude: {
          description:
            "Options for excluding specific versions or request paths of the shared module. When specified, matching modules will not be shared. Cannot be used with 'include'.",
          $ref: '#/definitions/IncludeExcludeOptions',
        },
        include: {
          description:
            "Options for including only specific versions or request paths of the shared module. When specified, only matching modules will be shared. Cannot be used with 'exclude'.",
          $ref: '#/definitions/IncludeExcludeOptions',
        },
        import: {
          description:
            "Provided module that should be provided to share scope. Also acts as fallback module if no shared module is found in share scope or version isn't valid. Defaults to the property name.",
          anyOf: [
            {
              description: 'No provided or fallback module.',
              enum: [false],
            },
            {
              $ref: '#/definitions/SharedItem',
            },
          ],
        },
        packageName: {
          description:
            "Package name to determine required version from description file. This is only needed when package name can't be automatically determined from request.",
          type: 'string',
          minLength: 1,
        },
        requiredVersion: {
          description: 'Version requirement from module in share scope.',
          anyOf: [
            {
              description: 'No version requirement check.',
              enum: [false],
            },
            {
              description:
                "Version as string. Can be prefixed with '^' or '~' for minimum matches. Each part of the version should be separated by a dot '.'.",
              type: 'string',
            },
          ],
        },
        shareKey: {
          description:
            'Module is looked up under this key from the share scope.',
          type: 'string',
          minLength: 1,
        },
        shareScope: {
          description: 'Share scope name.',
          anyOf: [
            {
              type: 'string',
              minLength: 1,
            },
            {
              type: 'array',
              items: {
                type: 'string',
                minLength: 1,
              },
            },
          ],
        },
        singleton: {
          description:
            'Allow only a single version of the shared module in share scope (disabled by default).',
          type: 'boolean',
        },
        strictVersion: {
          description:
            'Do not accept shared module if version is not valid (defaults to yes, if local fallback module is available and shared module is not a singleton, otherwise no, has no effect if there is no required version specified).',
          type: 'boolean',
        },
        version: {
          description:
            'Version of the provided module. Will replace lower matching versions, but not higher.',
          anyOf: [
            {
              description: "Don't provide a version.",
              enum: [false],
            },
            {
              description:
                "Version as string. Each part of the version should be separated by a dot '.'.",
              type: 'string',
            },
          ],
        },
        request: {
          description: 'Import request to match on',
          type: 'string',
          minLength: 1,
        },
        layer: {
          description: 'Layer in which the shared module should be placed.',
          type: 'string',
          minLength: 1,
        },
        issuerLayer: {
          description: 'Layer of the issuer.',
          type: 'string',
          minLength: 1,
        },
        nodeModulesReconstructedLookup: {
          description:
            'Enable reconstructed lookup for node_modules paths for this share item',
          type: 'boolean',
        },
      },
    },
    SharedItem: {
      description: 'A module that should be shared in the share scope.',
      type: 'string',
      minLength: 1,
    },
    SharedObject: {
      description:
        'Modules that should be shared in the share scope. Property names are used to match requested modules in this compilation. Relative requests are resolved, module requests are matched unresolved, absolute paths will match resolved requests. A trailing slash will match all requests with this prefix. In this case shareKey must also have a trailing slash.',
      type: 'object',
      additionalProperties: {
        description: 'Modules that should be shared in the share scope.',
        anyOf: [
          {
            $ref: '#/definitions/SharedConfig',
          },
          {
            $ref: '#/definitions/SharedItem',
          },
        ],
      },
    },
    Exclude: {
      description: 'Advanced filtering options.',
      type: 'object',
      additionalProperties: false,
      properties: {
        request: {
          description: 'Regular expression pattern to filter module requests',
          instanceof: 'RegExp',
        },
        version: {
          description:
            'Specific version string or range to filter by (exclude matches).',
          type: 'string',
        },
        fallbackVersion: {
          description:
            'Optional specific version string to check against the exclude.version range instead of reading package.json.',
          type: 'string',
        },
      },
    },
    IncludeExcludeOptions: {
      type: 'object',
      properties: {
        request: {
          type: ['string', 'object'],
          description:
            'A string (which can be a regex pattern) or a RegExp object to match the request path.',
        },
        version: {
          type: 'string',
          description:
            "Semantic versioning range to match against the module's version.",
        },
        fallbackVersion: {
          type: 'string',
          description:
            "Semantic versioning range to match against the fallback module's version for exclusion/inclusion context where applicable.",
        },
      },
      additionalProperties: false,
      anyOf: [
        {
          required: ['request'],
        },
        {
          required: ['version'],
        },
        {
          required: ['fallbackVersion'],
        },
      ],
    },
  },
  title: 'SharePluginOptions',
  description: 'Options for shared modules.',
  type: 'object',
  additionalProperties: false,
  properties: {
    async: {
      description:
        'Enable/disable asynchronous loading of runtime modules. When enabled, entry points will be wrapped in asynchronous chunks.',
      type: 'boolean',
    },
    shareScope: {
      description:
        "Share scope name used for all shared modules (defaults to 'default').",
      anyOf: [
        {
          type: 'string',
          minLength: 1,
        },
        {
          type: 'array',
          items: {
            type: 'string',
            minLength: 1,
          },
        },
      ],
    },
    shared: {
      $ref: '#/definitions/Shared',
    },
    experiments: {
      description: 'Experimental features configuration',
      type: 'object',
      additionalProperties: false,
      properties: {
        nodeModulesReconstructedLookup: {
          description: 'Enable reconstructed lookup for node_modules paths',
          type: 'boolean',
        },
      },
    },
  },
  required: ['shared'],
} as const;
