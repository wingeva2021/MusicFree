/**
 * 管理当前歌曲的歌词
 */

import { EDeviceEvents } from "@/constants/commonConst";
import LyricUtil from "@/native/lyricUtil";
import LyricParser, { IParsedLrcItem } from "@/utils/lrcParser";
import { getMediaExtra } from "@/utils/mediaExtra.ts";
import { isSameMediaItem } from "@/utils/mediaUtils.ts";
import minDistance from "@/utils/minDistance";
import { GlobalState } from "@/utils/stateMapper";
import { DeviceEventEmitter } from "react-native";
import Config from "./appConfig.ts";
import PluginManager from "./pluginManager";
import TrackPlayer from "./trackPlayer";

interface ILyricState {
  loading: boolean;
  lyricParser?: LyricParser;
  lyrics: IParsedLrcItem[];
  meta?: Record<string, string>;
  hasTranslation: boolean;
}

const defaultLyricState = {
  loading: true,
  lyrics: [],
  hasTranslation: false
};

const lyricStateStore = new GlobalState<ILyricState>(defaultLyricState);
const currentLyricStore = new GlobalState<IParsedLrcItem | null>(null);

function resetLyricState() {
  lyricStateStore.setValue(defaultLyricState);
}

// 重新获取歌词
async function refreshLyric(fromStart?: boolean, forceRequest = false) {
  const musicItem = TrackPlayer.currentMusic;
  try {
    if (!musicItem) {
      lyricStateStore.setValue({
        loading: false,
        lyrics: [],
        hasTranslation: false
      });

      currentLyricStore.setValue({
        index: 0,
        lrc: "MusicFree",
        time: 0
      });

      return;
    }

    const currentParserMusicItem =
      lyricStateStore.getValue()?.lyricParser?.musicItem;

    let lrcSource: ILyric.ILyricSource | null | undefined;
    if (
      forceRequest ||
      !isSameMediaItem(currentParserMusicItem, musicItem)
    ) {
      resetLyricState();
      currentLyricStore.setValue(null);

      lrcSource = await PluginManager.getByMedia(
        musicItem
      )?.methods?.getLyric(musicItem);
    } else {
      lrcSource = lyricStateStore.getValue().lyricParser?.lyricSource;
    }

    if (!lrcSource && Config.getConfig("lyric.autoSearchLyric")) {
      const keyword = musicItem.alias || musicItem.title;
      const plugins = PluginManager.getSearchablePlugins("lyric");

      let distance = Infinity;
      let minDistanceMusicItem;
      let targetPlugin;

      for (let plugin of plugins) {
        const realtimeMusicItem = TrackPlayer.currentMusic;
        if (
          !isSameMediaItem(musicItem, realtimeMusicItem) ||
          plugin.name === musicItem.platform
        ) {
          return;
        }
        const results = await plugin.methods
          .search(keyword, 1, "lyric")
          .catch(() => null);

        // 取前两个
        const firstTwo = results?.data?.slice(0, 2) || [];

        for (let item of firstTwo) {
          if (
            item.title === keyword &&
            item.artist === musicItem.artist
          ) {
            distance = 0;
            minDistanceMusicItem = item;
            targetPlugin = plugin;
            break;
          } else {
            const dist =
              minDistance(keyword, musicItem.title) +
              minDistance(item.artist, musicItem.artist);
            if (dist < distance) {
              distance = dist;
              minDistanceMusicItem = item;
              targetPlugin = plugin;
            }
          }
        }

        if (distance === 0) {
          break;
        }
      }
      if (minDistanceMusicItem && targetPlugin) {
        lrcSource = await targetPlugin.methods
          .getLyric(minDistanceMusicItem)
          .catch(() => null);
      }
    }

    const realtimeMusicItem = TrackPlayer.currentMusic;
    if (isSameMediaItem(musicItem, realtimeMusicItem)) {
      if (lrcSource) {
        const mediaExtra = getMediaExtra(musicItem);
        const parser = new LyricParser(lrcSource.rawLrc!, {
          extra: {
            offset: (mediaExtra?.lyricOffset || 0) * -1
          },
          musicItem: musicItem,
          lyricSource: lrcSource,
          translation: lrcSource.translation
        });

        lyricStateStore.setValue({
          loading: false,
          lyricParser: parser,
          lyrics: parser.getLyricItems(),
          hasTranslation: parser.hasTranslation,
          meta: parser.getMeta()
        });
        // 更新当前状态的歌词
        const currentLyric = fromStart
          ? parser.getLyricItems()[0]
          : parser.getPosition(
            (await TrackPlayer.getProgress()).position
          );
        currentLyricStore.setValue(currentLyric || null);
      } else {
        // 没有歌词
        lyricStateStore.setValue({
          loading: false,
          lyrics: [],
          hasTranslation: false
        });
      }
    }
  } catch (e) {
    console.log(e, "LRC");
    const realtimeMusicItem = TrackPlayer.currentMusic;
    if (isSameMediaItem(musicItem, realtimeMusicItem)) {
      // 异常情况
      lyricStateStore.setValue({
        loading: false,
        lyrics: [],
        hasTranslation: false
      });
    }
  }
}

// 获取歌词
async function setup() {
  DeviceEventEmitter.addListener(EDeviceEvents.REFRESH_LYRIC, refreshLyric);

  if (Config.getConfig("lyric.showStatusBarLyric")) {

    const statusBarLyricConfig = {
      topPercent: Config.getConfig("lyric.topPercent"),
      leftPercent: Config.getConfig("lyric.leftPercent"),
      align: Config.getConfig("lyric.align"),
      color: Config.getConfig("lyric.color"),
      backgroundColor: Config.getConfig("lyric.backgroundColor"),
      widthPercent: Config.getConfig("lyric.widthPercent"),
      fontSize: Config.getConfig("lyric.fontSize")
    };
    LyricUtil.showStatusBarLyric(
      "MusicFree",
      statusBarLyricConfig ?? {}
    );
  }

  refreshLyric();
}

const LyricManager = {
  setup,
  useLyricState: lyricStateStore.useValue,
  getLyricState: lyricStateStore.getValue,
  useCurrentLyric: currentLyricStore.useValue,
  getCurrentLyric: currentLyricStore.getValue,
  setCurrentLyric: currentLyricStore.setValue,
  refreshLyric,
  setLyricLoading: refreshLyric
};

export default LyricManager;
