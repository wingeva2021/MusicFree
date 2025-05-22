import ListItem from '@/components/base/listItem';
import { vmax } from '@/utils/rpx';
import Toast from '@/utils/toast';
import React from 'react';
import { View } from 'react-native';

import NoPlugin from '@/components/base/noPlugin';
import { showDialog } from '@/components/dialogs/useDialog';
import globalStyle from '@/constants/globalStyle';
import PluginManager from '@/core/pluginManager';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PanelBase from '../base/panelBase';
import PanelHeader from '../base/panelHeader';
import { showPanel } from '../usePanel';

export default function ImportMusicSheet() {
    const validPlugins = PluginManager.getSortedPluginsWithAbility('importMusicSheet');

    const safeAreaInsets = useSafeAreaInsets();

    return (
        <PanelBase
            height={vmax(60)}
            renderBody={() => (
                <>
                    <PanelHeader hideButtons title={'导入歌单'} />
                    {validPlugins.length ? (
                        <View style={globalStyle.fwflex1}>
                            <FlatList
                                data={validPlugins}
                                keyExtractor={plugin => plugin.hash}
                                style={{
                                    marginBottom: safeAreaInsets.bottom,
                                }}
                                renderItem={({ item: plugin }) => (
                                    <ListItem
                                        withHorizontalPadding
                                        key={`${plugin.hash}`}
                                        onPress={async () => {
                                            showPanel('SimpleInput', {
                                                title: '导入歌单',
                                                placeholder: '输入目标歌单',
                                                hints: plugin.instance.hints
                                                    ?.importMusicSheet,
                                                maxLength: 1000,
                                                async onOk(text, closePanel) {
                                                    Toast.success(
                                                        '正在导入中...',
                                                    );
                                                    closePanel();
                                                    const result =
                                                        await plugin.methods.importMusicSheet(
                                                            text,
                                                        );
                                                    if (result && result.length > 0) {
                                                        showDialog(
                                                            'SimpleDialog',
                                                            {
                                                                title: '准备导入',
                                                                content: `发现${result.length}首歌曲! 现在开始导入吗?`,
                                                                onOk() {
                                                                    showPanel(
                                                                        'AddToMusicSheet',
                                                                        {
                                                                            musicItem:
                                                                                result,
                                                                        },
                                                                    );
                                                                },
                                                            },
                                                        );
                                                    } else {
                                                        Toast.warn(
                                                            '链接有误或目标歌单为空',
                                                        );
                                                    }
                                                },
                                            });
                                        }}>
                                        <ListItem.Content title={plugin.name} />
                                    </ListItem>
                                )}
                            />
                        </View>
                    ) : (
                        <NoPlugin notSupportType="导入歌单" />
                    )}
                </>
            )}
        />
    );
}
