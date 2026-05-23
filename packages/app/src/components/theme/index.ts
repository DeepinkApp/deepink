import { createSystem, defaultConfig } from '@chakra-ui/react';
import baseConfig from '@components/theme/base';
import zenTheme from '@components/theme/color-schemes/zen';

export default createSystem(defaultConfig, baseConfig, zenTheme);
