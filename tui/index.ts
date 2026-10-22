import { Plugin } from "@opencode/plugin/tui";

const integrationID = "vnaipro";

export default Plugin.define({
  id: "vnaipro.tui",
  setup(context) {
    const announce = (event: { data: { integrationID?: string } }) => {
      if (event.data.integrationID !== integrationID) return;
      context.ui.toast.show({
        title: "VNAI Pro",
        message: "API key updated",
        variant: "success",
      });
    };

    const stopUpdated = context.data.on("credential.updated", announce);
    const stopSwitched = context.data.on("credential.switched", announce);
    return () => {
      stopUpdated();
      stopSwitched();
    };
  },
});
