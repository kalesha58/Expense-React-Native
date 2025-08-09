import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { Camera } from 'react-native-vision-camera';

export interface IPermissionStatus {
  camera: boolean;
  microphone: boolean;
  storage: boolean;
}

class PermissionService {
  private permissionStatus: IPermissionStatus = {
    camera: false,
    microphone: false,
    storage: false,
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
      const permissions = [
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      // Update permission status
      this.permissionStatus.camera = 
        results[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      
      this.permissionStatus.microphone = 
        results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      
      this.permissionStatus.storage = 
        results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
        results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

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
    } catch (error) {
      console.error('iOS permissions error:', error);
    }
  }

  async checkPermissions(): Promise<IPermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const cameraGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        const microphoneGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        const storageGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);

        this.permissionStatus = {
          camera: cameraGranted,
          microphone: microphoneGranted,
          storage: storageGranted,
        };
      } else {
        const cameraPermission = await Camera.getCameraPermissionStatus();
        const microphonePermission = await Camera.getMicrophonePermissionStatus();

        this.permissionStatus = {
          camera: cameraPermission === 'granted',
          microphone: microphonePermission === 'granted',
          storage: true,
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
