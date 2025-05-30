import React, { useState } from "react";
import ThemeText from "@/components/base/themeText";
import { StyleSheet, View } from "react-native";
import rpx, { vh } from "@/utils/rpx";
import openUrl from "@/utils/openUrl";
import Clipboard from "@react-native-clipboard/clipboard";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { hideDialog } from "../useDialog";
import Checkbox from "@/components/base/checkbox";
import Button from "@/components/base/textButton.tsx";
import Dialog from "./base";
import PersistStatus from "@/utils/persistStatus";
import { useI18N } from "@/core/i18n";

interface IDownloadDialogProps {
    version: string;
    content: string[];
    fromUrl: string;
    backUrl?: string;
}
export default function DownloadDialog(props: IDownloadDialogProps) {
    const {content, fromUrl, backUrl, version} = props;
    const [skipState, setSkipState] = useState(false);

    const {t} = useI18N();

    return (
        <Dialog
            onDismiss={() => {
                if (skipState) {
                    PersistStatus.set('app.skipVersion', version);
                }
                hideDialog();
            }}>
            <Dialog.Title stringContent>{t("dialog.downloadDialog.title", {
                version: version,
            })}</Dialog.Title>
            <ScrollView style={style.scrollView}>
                {content?.map?.(_ => (
                    <ThemeText key={_} style={style.item}>
                        {_}
                    </ThemeText>
                ))}
            </ScrollView>
            <Dialog.Actions style={style.dialogActions}>
                <TouchableOpacity
                    onPress={() => {
                        setSkipState(state => !state);
                    }}>
                    <View style={style.checkboxGroup}>
                        <Checkbox checked={skipState} />
                        <ThemeText style={style.checkboxHint}>
                            {t("dialog.downloadDialog.skipThisVersion")}
                        </ThemeText>
                    </View>
                </TouchableOpacity>
                <View style={style.buttonGroup}>
                    <Button
                        style={style.button}
                        onPress={() => {
                            hideDialog();
                            if (skipState) {
                                PersistStatus.set('app.skipVersion', version);
                            }
                        }}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        style={style.button}
                        onPress={async () => {
                            PersistStatus.set('app.skipVersion', undefined);
                            openUrl(fromUrl);
                            Clipboard.setString(fromUrl);
                        }}>
                        {t("dialog.downloadDialog.downloadUsingBrowser")}
                    </Button>
                    {backUrl && (
                        <Button
                            style={style.button}
                            onPress={async () => {
                                PersistStatus.set('app.skipVersion', undefined);
                                openUrl(backUrl);
                                Clipboard.setString(backUrl);
                            }}>
                            {t("dialog.downloadDialog.backupUrl")}
                        </Button>
                    )}
                </View>
            </Dialog.Actions>
        </Dialog>
    );
}

const style = StyleSheet.create({
    item: {
        marginBottom: rpx(20),
        lineHeight: rpx(36),
    },
    content: {
        flex: 1,
        maxHeight: vh(50),
    },
    scrollView: {
        maxHeight: vh(40),
        paddingHorizontal: rpx(26),
    },
    dialogActions: {
        marginTop: rpx(24),
        height: rpx(120),
        marginBottom: rpx(12),
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    checkboxGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'flex-end',
    },
    checkboxHint: {
        marginLeft: rpx(12),
    },
    button: {
        paddingLeft: rpx(28),
        paddingVertical: rpx(14),
        marginLeft: rpx(16),
        alignItems: 'flex-end',
    },
});
