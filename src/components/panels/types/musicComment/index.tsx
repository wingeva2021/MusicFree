import React from "react";
import { StyleSheet, View } from "react-native";
import rpx from "@/utils/rpx";
import PanelFullscreen from "@/components/panels/base/panelFullscreen.tsx";
import AppBar from "@/components/base/appBar.tsx";
import { hidePanel } from "@/components/panels/usePanel.ts";
import globalStyle from "@/constants/globalStyle.ts";
import VerticalSafeAreaView from "@/components/base/verticalSafeAreaView.tsx";
import Loading from "@/components/base/loading.tsx";
import { FlashList } from "@shopify/flash-list";
import FastImage from "@/components/base/fastImage";
import { ImgAsset } from "@/constants/assetsConst.ts";
import ThemeText from "@/components/base/themeText.tsx";
import Comment from "@/components/panels/types/musicComment/comment.tsx";
import useComments from "@/components/panels/types/musicComment/useComments.ts";
import { RequestStateCode } from "@/constants/commonConst.ts";
import Empty from "@/components/base/empty.tsx";
import { useI18N } from "@/core/i18n";

interface IMusicCommentProps {
    musicItem: IMusic.IMusicItem;
}


export default function MusicComment(props: IMusicCommentProps) {
    const {musicItem} = props;

    const [reqState, comments] = useComments(musicItem);
    const {t} = useI18N();

    let listBody = <></>;

    if (reqState & RequestStateCode.LOADING) {
        listBody = <Loading />;
    } else if (reqState === RequestStateCode.ERROR) {
        listBody = <Empty />;
    } else {
        listBody = (
            <FlashList
                ListEmptyComponent={<Empty />}
                estimatedItemSize={100}
                renderItem={({item}) => {
                    return <Comment comment={item} />;
                }}
                data={comments}
            />
        );
    }

    return (
        <PanelFullscreen>
            <VerticalSafeAreaView style={globalStyle.fwflex1}>
                <AppBar withStatusBar children={t("common.comment")} onBackPress={hidePanel} />
                <View style={styles.musicItemContainer}>
                    <FastImage
                        style={styles.musicItemArtwork}
                        uri={musicItem?.artwork}
                        emptySrc={ImgAsset.albumDefault}
                    />
                    <View style={styles.musicItemContent}>
                        <ThemeText fontSize="subTitle" numberOfLines={1}>
                            {musicItem.title}
                        </ThemeText>
                        <ThemeText
                            fontSize="description"
                            numberOfLines={1}
                            fontColor="textSecondary">
                            {musicItem.artist}
                        </ThemeText>
                    </View>
                </View>
                {listBody}
            </VerticalSafeAreaView>
        </PanelFullscreen>
    );
}

const styles = StyleSheet.create({
    musicItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rpx(16),
        paddingHorizontal: rpx(24),
        height: rpx(120),
    },
    musicItemArtwork: {
        width: rpx(88),
        height: rpx(88),
        borderRadius: rpx(12),
    },
    musicItemContent: {
        flex: 1,
        gap: rpx(16),
    },
});
