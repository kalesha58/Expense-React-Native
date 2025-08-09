import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export interface IPermissionStatus {
  camera: boolean;
  microphone: boolean;
  storage: boolean;
  mediaImages: boolean;
  manageStorage: boolean;
}

class PermissionService {
  private permissionStatus: IPermissionStatus = {
    camera: false,
    microphone: false,
    storage: false,
    mediaImages: false,
    manageStorage: false,
  };

  async requestAllPermissions(): Promise<IPermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        await this.requestAndroidPermissions();
      } else {
        await this.requestIOSPermissions();
      }
      
      return this.permissionStatus;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return this.permissionStatus;
    }
  }

  private async requestAndroidPermissions(): Promise<void> {
    try {
      const androidVersion = Platform.Version as number;
      
      // Base permissions for all versions
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ];

      // Add storage permissions based on Android version
      if (androidVersion >= 33) {
        // Android 13+ (API 33+) - Use granular media permissions
        permissions.push(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
        );
      } else if (androidVersion >= 30) {
        // Android 11+ (API 30+) - Use MANAGE_EXTERNAL_STORAGE for downloads
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      } else {
        // Android 10 and below - Use legacy storage permissions
        permissions.push(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
      }

      const results = await PermissionsAndroid.requestMultiple(permissions);

      // Update permission status
      this.permissionStatus.camera = 
        results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      
      this.permissionStatus.microphone = 
        results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      
      // Handle storage permissions based on Android version
      if (androidVersion >= 33) {
        this.permissionStatus.mediaImages = 
          results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] === PermissionsAndroid.RESULTS.GRANTED;
        this.permissionStatus.storage = this.permissionStatus.mediaImages;
      } else {
        this.permissionStatus.storage = 
          results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
        
        if (androidVersion < 30 && PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE) {
          this.permissionStatus.storage = this.permissionStatus.storage &&
            results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
        }
      }

      // Set default values for unused permissions
      this.permissionStatus.mediaImages = this.permissionStatus.mediaImages || false;
      this.permissionStatus.manageStorage = false; // This requires special handling

    } catch (error) {
      console.error('Android permissions error:', error);
    }
  }

  private async requestIOSPermissions(): Promise<void> {
    try {
      // For iOS, we use react-native-vision-camera's permission system
      const cameraPermission = await Camera.requestCameraPermission();
      const microphonePermission = await Camera.requestMicrophonePermission();

      this.permissionStatus.camera = cameraPermission === 'granted';
      this.permissionStatus.microphone = microphonePermission === 'granted';
      this.permissionStatus.storage = true; // iOS doesn't need explicit storage permission for app sandbox
      this.permissionStatus.mediaImages = true; // iOS handles media access differently
      this.permissionStatus.manageStorage = true; // iOS manages storage permissions automatically
    } catch (error) {
      console.error('iOS permissions error:', error);
    }
  }

  async checkPermissions(): Promise<IPermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const androidVersion = Platform.Version as number;
        
        const cameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        const microphoneGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        
        let storageGranted = false;
        let mediaImagesGranted = false;
        
        if (androidVersion >= 33) {
          // Android 13+ - Check media permissions
          mediaImagesGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
          storageGranted = mediaImagesGranted;
        } else {
          // Android 12 and below - Check external storage permission
          storageGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        }

        this.permissionStatus = {
          camera: cameraGranted,
          microphone: microphoneGranted,
          storage: storageGranted,
          mediaImages: mediaImagesGranted,
          manageStorage: false, // This requires special handling
        };
      } else {
        const cameraPermission = await Camera.getCameraPermissionStatus();
        const microphonePermission = await Camera.getMicrophonePermissionStatus();

        this.permissionStatus = {
          camera: cameraPermission === 'granted',
          microphone: microphonePermission === 'granted',
          storage: true,
          mediaImages: true,
          manageStorage: true,
        };
      }

      return this.permissionStatus;
    } catch (error) {
      console.error('Error checking permissions:', error);
      return this.permissionStatus;
    }
  }

  getPermissionStatus(): IPermissionStatus {
    return this.permissionStatus;
  }

  async requestDownloadPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS doesn't need explicit download permissions
        return true;
      }

      const androidVersion = Platform.Version as number;
      
      if (androidVersion >= 33) {
        // Android 13+ - Request media images permission for downloads
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: 'Download Permission',
            message: 'This app needs access to save downloaded files to your device.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        // Android 12 and below - Request external storage permission
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Download Permission',
            message: 'This app needs access to save downloaded files to your device.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return result === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.error('Error requesting download permissions:', error);
      return false;
    }
  }

  showPermissionAlert(missingPermissions: string[]): void {
    const permissionList = missingPermissions.join(', ');
    
    Alert.alert(
      'Permissions Required',
      `This app needs access to ${permissionList} to function properly. Please grant these permissions in your device settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => {
            // You can implement opening device settings here
            console.log('Open device settings');
          }
        }
      ]
    );
  }
}

export const permissionService = new PermissionService();
