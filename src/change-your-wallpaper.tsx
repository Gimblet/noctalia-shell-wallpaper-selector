import {
    Action,
    ActionPanel,
    Color,
    getPreferenceValues,
    Icon,
    Image,
    List,
    showToast,
    Toast,
} from "@vicinae/api";
import fs from 'fs';
import {exec} from 'child_process'

type Wallpaper = {
    image: Image;
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
            const preview: Image = {source: filePath, fallback: "https://placehold.co/600x400?text=Wallpaper"}
            const type:string = getImageType(file);
            const wallpaper: Wallpaper = {
                image: preview,
                filename: file,
                path: filePath,
                type: type,
                resolution: "null"
            };

            wallpapers_info.push(wallpaper)
        }
    });
}

// TODO: Needs optimizing by starting at the final of the file instead of the beggining
function getImageType(filename: string) {
    const regex: RegExp = RegExp("^\\.[^.]+$");
    for (let i: number = 0; i < filename.length; i++) {
        if (filename.charAt(i) == ".") {
            let possibleResult:string = filename.slice(i, filename.length)
            if (possibleResult.match(regex)) return possibleResult.toUpperCase();
        }
    }
    return filename
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
                                markdown={`![${wallpaper.filename}](${wallpaper.path})`}
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
                                <Action
                                    title="Set wallpaper"
                                    onAction={async () => {
                                        await showToast({
                                            style: Toast.Style.Animated,
                                            title: "Setting wallpaper...",
                                        });
                                        exec(`noctalia-shell ipc call wallpaper set "${wallpaper.path}" "${display}"`, async (error) => {
                                            if (error) {
                                                await showToast({
                                                    style: Toast.Style.Failure,
                                                    title: "Failed to set wallpaper",
                                                    message: error.message,
                                                });
                                            } else {
                                                await showToast({
                                                    style: Toast.Style.Success,
                                                    title: "Wallpaper set",
                                                });
                                            }
                                        });
                                    }}
                                    icon={Icon.Image}
                                />
                                <Action.Open
                                    title="View wallpaper"
                                    target={wallpaper.path}
                                    icon={Icon.Eye}
                                />
                                <Action.ShowInFinder
                                    title="Open in file explorer"
                                    path={wallpaper.path}
                                    icon={Icon.Folder}
                                />
                                <Action.CopyToClipboard
                                    title="Copy wallpaper path"
                                    content={wallpaper.path}
                                    icon={Icon.Folder}
                                />
                            </ActionPanel>
                        }
                    />
                ))}
            </List.Section>
        </List>
    );
}