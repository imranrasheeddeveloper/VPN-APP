import { NativeModules } from 'react-native'

const { WireGuardModule } = NativeModules

export const prepareVPN = () => WireGuardModule.prepare()
export const connectVPN = (config: string) => WireGuardModule.connect(config)
export const disconnectVPN = () => WireGuardModule.disconnect()
