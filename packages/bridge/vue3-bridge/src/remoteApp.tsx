import {
  ref,
  onMounted,
  onBeforeUnmount,
  watch,
  defineComponent,
  useAttrs,
} from 'vue';
import { dispatchPopstateEnv } from '@module-federation/bridge-shared';
import { useRoute } from 'vue-router';
import { LoggerInstance } from './utils';
import { getInstance } from '@module-federation/runtime';

export default defineComponent({
  name: 'RemoteApp',
  props: {
    moduleName: String,
    basename: String,
    memoryRoute: Object,
    hashRoute: Boolean,
    providerInfo: Function,
    rootAttrs: Object,
  },
  inheritAttrs: false,
  setup(props) {
    const rootRef = ref(null);
    const providerInfoRef = ref(null);
    const pathname = ref('');
    const route = useRoute();
    const hostInstance = getInstance();
    const componentAttrs = useAttrs();

    const renderComponent = async () => {
      const providerReturn = props.providerInfo?.();
      providerInfoRef.value = providerReturn;

      let renderProps = {
        ...componentAttrs,
        moduleName: props.moduleName,
        dom: rootRef.value,
        basename: props.basename,
        memoryRoute: props.memoryRoute,
        hashRoute: props.hashRoute,
      };
      LoggerInstance.debug(
        `createRemoteAppComponent LazyComponent render >>>`,
        renderProps,
      );

      const beforeBridgeRenderRes =
        (await hostInstance?.bridgeHook?.lifecycle?.beforeBridgeRender?.emit(
          renderProps,
        )) || {};

      renderProps = { ...renderProps, ...beforeBridgeRenderRes.extraProps };
      providerReturn.render(renderProps);
      hostInstance?.bridgeHook?.lifecycle?.afterBridgeRender?.emit(renderProps);
    };

    const watchStopHandle = watch(
      () => route?.path,
      (newPath) => {
        if (newPath !== route.path) {
          renderComponent();
        }

        // dispatchPopstateEnv
        if (pathname.value !== '' && pathname.value !== newPath) {
          LoggerInstance.debug(
            `createRemoteAppComponent dispatchPopstateEnv >>>`,
            {
              ...props,
              pathname: route.path,
            },
          );
          dispatchPopstateEnv();
        }
        pathname.value = newPath;
      },
    );

    onMounted(() => {
      renderComponent();
    });

    onBeforeUnmount(() => {
      LoggerInstance.debug(
        `createRemoteAppComponent LazyComponent destroy >>>`,
        {
          ...props,
        },
      );
      watchStopHandle();

      hostInstance?.bridgeHook?.lifecycle?.beforeBridgeDestroy?.emit({
        name: props.moduleName,
        dom: rootRef.value,
        basename: props.basename,
        memoryRoute: props.memoryRoute,
        hashRoute: props.hashRoute,
      });

      (providerInfoRef.value as any)?.destroy({ dom: rootRef.value });
      hostInstance?.bridgeHook?.lifecycle?.afterBridgeDestroy?.emit({
        name: props.moduleName,
        dom: rootRef.value,
        basename: props.basename,
        memoryRoute: props.memoryRoute,
        hashRoute: props.hashRoute,
      });
    });

    return () => <div {...(props.rootAttrs || {})} ref={rootRef}></div>;
  },
});
