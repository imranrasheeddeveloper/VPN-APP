import { NativeModules } from 'react-native'
const { WireGuard } = NativeModules

export const prepareVPN = () => WireGuard.prepare()
export const connectVPN = (config: string) => WireGuard.connect(config)
export const disconnectVPN = () => WireGuard.disconnect()
