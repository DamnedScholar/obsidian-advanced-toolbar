import { App, Setting, PluginSettingTab, Platform, FuzzySuggestModal, FuzzyMatch, setIcon, Command } from "obsidian"
import AdvancedToolbar from "src/main";

export default class ATSettingsTab extends PluginSettingTab {
    plugin: AdvancedToolbar;

    constructor(app: App, plugin: AdvancedToolbar) {
        super(app, plugin);
        this.plugin = plugin;
        addEventListener("AT-iconPicked", () => {
            this.display();
        });
    }

    display(): void {
        let { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Advanced Toolbar Settings' });

        if (Platform.isDesktop) {
            containerEl.createEl('span', { text: "Please Note that this Plugin doesn't affect the Desktop App. It only applies to Obsidian's Mobile App.", cls: "setting-item AT-warning" })
        }

        new Setting(containerEl)
            .setName('Always Show Toolbar')
            .setDesc('Set the Mobile Toolbar to be always visible, even if your on-screen Keyboard disappears.')
            .addToggle(cb => cb
                .setValue(this.plugin.settings.alwaysShowToolbar)
                .onChange(async (value) => {
                    this.plugin.settings.alwaysShowToolbar = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Toolbar Row Count")
            .setDesc("Set how many Rows the Mobile Toolbar should have.")
            .addSlider(cb => cb
                .setLimits(1, 5, 1)
                .setValue(this.plugin.settings.rowCount)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.rowCount = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateStyles();
                })
            );

        if (Platform.isMobile) {
            const description = document.createDocumentFragment();
            description.appendChild(createEl("h3", { text: "Custom Icons" }));
            containerEl.appendChild(description);

            this.plugin.getCommandsWithoutIcons().forEach(command => {
                new Setting(containerEl)
                    .setName(command.name)
                    .setDesc(`ID: ${command.id}`)
                    .addButton(bt => {
                        const iconDiv = bt.buttonEl.createDiv({cls: "AT-settings-icon"})
                        setIcon(iconDiv, this.plugin.settings.mappedIcons.find(m => m.commandID === command.id).iconID, 20)
                        bt.onClick(() => {
                            new IconPicker(this.plugin, command, this.display).open();
                        })
                    });
            });
        }

        const advancedEl = containerEl.appendChild(createEl("details"));
        advancedEl.appendChild(createEl("summary", { text: "Advanced Settings" }));

        new Setting(advancedEl)
            .setName("Button Height")
            .setDesc("Change the Height of each Button inside the Mobile Toolbar (in px).")
            .addText(cb => cb
                .setValue(this.plugin.settings.rowHeight?.toString() ?? "48")
                .setPlaceholder("48")
                .onChange(async (value) => {
                    const height = Number(value);
                    if (!isNaN(height)) {
                        if(cb.inputEl.hasClass("is-invalid")) {
                            cb.inputEl.removeClass("is-invalid")
                        }
                        this.plugin.settings.rowHeight = height;
                        await this.plugin.saveSettings();
                        this.plugin.updateStyles();
                    } else {
                        if(!cb.inputEl.hasClass("is-invalid")) {
                            cb.inputEl.addClass("is-invalid")
                        }
                    }
                })
            );
        new Setting(advancedEl)
            .setName("Debugging")
            .setDesc("Enable Debugging")
            .addToggle(cb => {
                cb.setValue(this.plugin.settings.debugging);
                cb.onChange(async (value) => {
                    this.plugin.settings.debugging = value;
                    await this.plugin.saveSettings();
                })
            });
        new Setting(containerEl)
            .setName('Donate')
            .setDesc('If you like this Plugin, consider donating to support continued development:')
            .setClass("extra")
            .addButton((bt) => {
                bt.buttonEl.outerHTML = `<a href="https://www.buymeacoffee.com/phibr0"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=phibr0&button_colour=5F7FFF&font_colour=ffffff&font_family=Inter&outline_colour=000000&coffee_colour=FFDD00"></a>`;
            });
    }
}

export class IconPicker extends FuzzySuggestModal<string>{
    plugin: AdvancedToolbar;
    command: Command;

    constructor(plugin: AdvancedToolbar, command: Command, display: any) {
        super(plugin.app);
        this.plugin = plugin;
        this.command = command;
        this.setPlaceholder("Pick an Icon");
    }

    getItems(): string[] {
        return this.plugin.iconList;
    }

    getItemText(item: string): string {
        return item.replace("feather-", "");
    }

    renderSuggestion(item: FuzzyMatch<string>, el: HTMLElement): void {
        el.addClass("AT-icon-container");
        const div = createDiv({ cls: "AT-icon" });
        el.appendChild(div);
        setIcon(div, item.item);
        super.renderSuggestion(item, el);
    }

    async onChooseItem(item: string): Promise<void> {
        this.plugin.log("changed to: " + item);
        this.plugin.settings.mappedIcons.remove(this.plugin.settings.mappedIcons.find(m => m.commandID === this.command.id))
        this.plugin.settings.mappedIcons.push({ commandID: this.command.id, iconID: item })
        await this.plugin.saveSettings();
        this.plugin.injectIcons();
        this.close();
        setTimeout(() => {
            dispatchEvent(new Event("AT-iconPicked"));
        }, 100);
    }

}
