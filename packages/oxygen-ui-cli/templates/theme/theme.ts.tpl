import { createOxygenTheme{{baseImportSpecifier}} } from '@wso2/oxygen-ui'

/**
 * {{themeName}} - a custom Oxygen UI theme.
 *
 * The configuration below is deep-merged into {{baseThemeLabel}} by
 * createOxygenTheme. Any Material UI theme option can be overridden here:
 * https://mui.com/material-ui/customization/theming/
 */
const {{themeName}} = createOxygenTheme(
  {
    colorSchemes: {
      light: {
        palette: {
          primary: {
            main: '#ff7300',
          },
          secondary: {
            main: '#212a32',
          },
        },
      },
      dark: {
        palette: {
          primary: {
            main: '#ff7300',
          },
          secondary: {
            main: '#e0e2e5',
          },
        },
      },
    },
    // components: {
    //   MuiButton: {
    //     styleOverrides: {
    //       root: { borderRadius: 8 },
    //     },
    //   },
    // },
  }{{baseArgument}}
)

export default {{themeName}}
