import {
    AdEventType,
    InterstitialAd,
} from 'react-native-google-mobile-ads';

class InterstitialManager {
  private ad: InterstitialAd | null = null;
  private loaded = false;

  init(adUnitId: string) {
    if (this.ad) return; // already initialized

    this.ad = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    this.ad.addAdEventListener(AdEventType.LOADED, () => {
      this.loaded = true;
      console.log('✅ Interstitial loaded');
    });

    this.ad.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('🔁 Interstitial closed → reload');
      this.loaded = false;
      this.ad?.load();
    });

    this.ad.addAdEventListener(AdEventType.ERROR, (e) => {
      console.log('❌ Interstitial error:', e);
      this.loaded = false;
    });

    this.ad.load();
  }

  show() {
    if (this.ad && this.loaded) {
      this.ad.show();
      return true;
    }
    return false;
  }

  isLoaded() {
    return this.loaded;
  }
}

export const interstitialManager = new InterstitialManager();
