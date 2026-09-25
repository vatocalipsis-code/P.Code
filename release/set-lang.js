export const setLang = {
  Name: "tcash-container-layout-preview",
  Version: 1,
  Data: [
    {
      Login: "Tcash Base",
      Properties: { Background: "#031421", TextColor: "#E8F2FF", Alignment: "Stretch", Distribution: "Start", Direction: "Vertical", Padding: 16, Gap: 16 },
      Containers: [],
      SimplePanels: [
        {
          Login: "Tcash Header",
          Properties: { PanelTransparency: 1, Alignment: "Center", Distribution: "Start", Direction: "Horizontal", Gap: 8, Height: 48, AggregateActivePanels: [] },
          Containers: [
            { Login: "Tcash Title", Properties: { TextColor: "#FFFFFF", FontSize: 28, FontWeight: 700, Distribution: "Start", Orientation: "Horizontal", Flip: false } },
            { Login: "Tcash Version", Properties: { TextColor: "#78BFFF", FontSize: 14, FontWeight: 400, Distribution: "Start", Orientation: "Horizontal", Flip: true } },
            { Login: "Tcash Menu", Properties: { Width: 34, Height: 34 } }
          ],
          ActivePanels: []
        },
        {
          Login: "My Cashes",
          Properties: { PanelTransparency: 1, Alignment: "Stretch", Distribution: "Start", Direction: "Vertical", Gap: 8, AggregateActivePanels: [] },
          Containers: [
            { Login: "My Cashes Title", Properties: { TextColor: "#39CFFF", FontSize: 20, FontWeight: 700, Distribution: "Start" } }
          ],
          ActivePanels: [
            {
              Login: "Main Cash Row",
              Properties: { PanelTransparency: 1, Shadow: 8, Alignment: "Center", Distribution: "Start", Direction: "Horizontal", Gap: 10, Height: 58, OnPress: null, OffPress: null },
              Containers: [
                { Login: "Main Cash Icon", Properties: { Width: 48, Height: 48, PictureTint: "#20F5B0", Orientation: "Horizontal", Flip: false } },
                { Login: "Main Cash Name", Properties: { TextColor: "#FFFFFF", FontSize: 18, FontWeight: 500, Distribution: "Start", Orientation: "Horizontal", Flip: true } },
                { Login: "Main Cash Amount", Properties: { TextColor: "#20F5B0", FontSize: 19, FontWeight: 600, Distribution: "End", Orientation: "Horizontal", Flip: false } },
                { Login: "Main Cash Arrow", Properties: { TextColor: "#5CD5FF", FontSize: 26, Width: 18 } }
              ]
            },
            {
              Login: "Office Cash Row",
              Properties: { PanelTransparency: 1, Shadow: 6, Alignment: "Center", Distribution: "Start", Direction: "Horizontal", Gap: 10, Height: 58, OnPress: null, OffPress: null },
              Containers: [
                { Login: "Office Cash Icon", Properties: { Width: 48, Height: 48, PictureTint: "#258CFF", Orientation: "Horizontal", Flip: false } },
                { Login: "Office Cash Name", Properties: { TextColor: "#FFFFFF", FontSize: 18, FontWeight: 500, Distribution: "Start", Orientation: "Horizontal", Flip: true } },
                { Login: "Office Cash Amount", Properties: { TextColor: "#FFFFFF", FontSize: 19, FontWeight: 500, Distribution: "End", Orientation: "Horizontal", Flip: false } },
                { Login: "Office Cash Arrow", Properties: { TextColor: "#5CD5FF", FontSize: 26, Width: 18 } }
              ]
            }
          ]
        },
        {
          Login: "Subordinate Cashes",
          Properties: { PanelTransparency: 1, Alignment: "Stretch", Distribution: "Start", Direction: "Vertical", Gap: 8, AggregateActivePanels: [] },
          Containers: [
            { Login: "Subordinate Cashes Title", Properties: { TextColor: "#39CFFF", FontSize: 20, FontWeight: 700, Distribution: "Start" } }
          ],
          ActivePanels: [
            {
              Login: "Trips Row",
              Properties: { PanelTransparency: 1, Shadow: 6, Alignment: "Center", Distribution: "Start", Direction: "Horizontal", Gap: 10, Height: 58, OnPress: null, OffPress: null },
              Containers: [
                { Login: "Trips Icon", Properties: { Width: 48, Height: 48, PictureTint: "#FF8A3D", Orientation: "Horizontal", Flip: false } },
                { Login: "Trips Name", Properties: { TextColor: "#FFFFFF", FontSize: 18, FontWeight: 500, Distribution: "Start", Orientation: "Horizontal", Flip: true } },
                { Login: "Trips Amount", Properties: { TextColor: "#FFFFFF", FontSize: 19, FontWeight: 500, Distribution: "End", Orientation: "Horizontal", Flip: false } },
                { Login: "Trips Arrow", Properties: { TextColor: "#5CD5FF", FontSize: 26, Width: 18 } }
              ]
            },
            {
              Login: "Shop Row",
              Properties: { PanelTransparency: 1, Shadow: 6, Alignment: "Center", Distribution: "Start", Direction: "Horizontal", Gap: 10, Height: 58, OnPress: null, OffPress: null },
              Containers: [
                { Login: "Shop Icon", Properties: { Width: 48, Height: 48, PictureTint: "#D84CFF", Orientation: "Horizontal", Flip: false } },
                { Login: "Shop Name", Properties: { TextColor: "#FFFFFF", FontSize: 18, FontWeight: 500, Distribution: "Start", Orientation: "Horizontal", Flip: true } },
                { Login: "Shop Amount", Properties: { TextColor: "#FFFFFF", FontSize: 19, FontWeight: 500, Distribution: "End", Orientation: "Horizontal", Flip: false } },
                { Login: "Shop Arrow", Properties: { TextColor: "#5CD5FF", FontSize: 26, Width: 18 } }
              ]
            }
          ]
        }
      ]
    }
  ]
};
