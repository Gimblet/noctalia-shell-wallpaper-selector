import {
    Action,
    ActionPanel,
    Color,
    getPreferenceValues,
    Icon,
    KeyEquivalent,
    List,
    showToast,
    Toast,
} from "@vicinae/api";
import fs from 'fs';

type Wallpaper = {
    image: any;
    filename: string;
    path: string;
    type: string;
    resolution: string; // Markdown formatted description
};

interface Preference {
    wallpaper_directory: string,
    display_name: string
}

// Preferences (Set in extension config)
export const preferences = getPreferenceValues<Preference>();
export const path: string = preferences.wallpaper_directory;
export const display: string = preferences.display_name;

export const wallpapers_info: Wallpaper[] = [];

function traverseDirectory(directoryPath: string) {
    const files = fs.readdirSync(directoryPath);

    files.forEach((file) => {
        let filePath: string;

        if (directoryPath.endsWith("/")) {
            filePath = directoryPath + file;
        } else {
            filePath = directoryPath + '/' + file;
        }
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            traverseDirectory(filePath); // recursively call the function for subdirectories
        } else {
            const wallpaper: Wallpaper = {
                image: null,
                filename: file,
                path: filePath,
                type: file,
                resolution: "null"
            };

            wallpapers_info.push(wallpaper)
        }
    });
}

traverseDirectory(path);

export default function ListDetail() {
    return (
        <List isShowingDetail searchBarPlaceholder={"Select Your Wallpaper..."}>
            <List.Section title={"Wallpapers"}>
                {wallpapers_info.map((wallpaper) => (
                    <List.Item
                        key={wallpaper.path}
                        title={wallpaper.filename}
                        icon={wallpaper.image}
                        detail={
                            <List.Item.Detail
                                markdown={wallpaper.filename}
                                metadata={
                                    <List.Item.Detail.Metadata>
                                        <List.Item.Detail.Metadata.Label
                                            title="Path"
                                            text={wallpaper.path}
                                            icon={Icon.Folder}
                                        />
                                        <List.Item.Detail.Metadata.TagList title="Type">
                                            <List.Item.Detail.Metadata.TagList.Item
                                                color={Color.Yellow}
                                                text={wallpaper.type}
                                                icon={Icon.Image}
                                            />
                                        </List.Item.Detail.Metadata.TagList>
                                        <List.Item.Detail.Metadata.Separator/>
                                        <List.Item.Detail.Metadata.Label
                                            title="Resolution"
                                            text={wallpaper.resolution}
                                        />
                                    </List.Item.Detail.Metadata>
                                }
                            />
                        }
                        actions={
                            <ActionPanel>
                                <Action.RunInTerminal
                                    title="Set Wallpaper"
                                    args={["noctalia-shell", "ipc", "call", "wallpaper", "set", wallpaper.path, display]}
                                    options={{hold: false}}
                                    icon={Icon.Image}
                                />
                                <Action.CopyToClipboard
                                    title="Copy emoji"
                                    content={wallpaper.filename}
                                />
                                <Action
                                    title="Custom action"
                                    icon={Icon.Cog}
                                    onAction={() =>
                                        showToast({title: "Hello from custom action"})
                                    }
                                />

                                {(
                                    [
                                        "arrowUp",
                                        "arrowDown",
                                        "arrowLeft",
                                        "arrowRight",
                                    ] as KeyEquivalent[]
                                ).map((arrow) => (
                                    <Action
                                        title="Up"
                                        shortcut={{key: arrow, modifiers: ["shift"]}}
                                        onAction={() => showToast(Toast.Style.Success, arrow)}
                                    />
                                ))}
                            </ActionPanel>
                        }
                    />
                ))}
            </List.Section>
        </List>
    );
}