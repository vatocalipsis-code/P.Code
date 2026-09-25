export const setLang = {
  Name: "group-layout-proof",
  Version: 1,
  Data: [{
    Login: "Proof Base",
    Properties: { Background: "#031421", Direction: "Vertical", Padding: 18, Gap: 22 },
    Layout: [],
    SimplePanels: [{
      Login: "Proof Surface",
      Properties: { PanelTransparency: 1, Direction: "Vertical", Gap: 18, AggregateActivePanels: [] },
      Layout: [],
      ActivePanels: [{
        Login: "Main Cash Row",
        Properties: { PanelTransparency: 1, Shadow: 7, Direction: "Vertical", Height: 68 },
        Layout: [{ Type: "Group", Properties: { Orientation: "Horizontal", FillHorizontal: true, FillVertical: true, Gap: 8 }, Layout: [
          { Login: "Main Icon", Properties: { Width: 46, Height: 46, PictureTint: "#20F5B0", VerticalAlignment: "Center" } },
          { Type: "Group", Properties: { Orientation: "Vertical", FillHorizontal: true, FillVertical: true, Gap: 2 }, Layout: [
            { Login: "Main Name", Properties: { FillHorizontal: true, FillVertical: true, TextColor: "#FFFFFF", FontSize: 18, FontWeight: 600, HorizontalAlignment: "Left", VerticalAlignment: "Bottom" } },
            { Login: "Main Meta", Properties: { FillHorizontal: true, FillVertical: true, TextColor: "#8FB7D8", FontSize: 14, HorizontalAlignment: "Left", VerticalAlignment: "Top" } }
          ]},
          { Type: "Group", Properties: { Orientation: "Vertical", FillVertical: true, Gap: 2 }, Layout: [
            { Login: "Main Amount", Properties: { FillVertical: true, TextColor: "#20F5B0", FontSize: 19, FontWeight: 700, HorizontalAlignment: "Right", VerticalAlignment: "Bottom" } },
            { Login: "Main Currency", Properties: { FillVertical: true, TextColor: "#8FB7D8", FontSize: 14, HorizontalAlignment: "Right", VerticalAlignment: "Top" } }
          ]},
          { Login: "Main Arrow", Properties: { Width: 18, FillVertical: true, TextColor: "#5CD5FF", FontSize: 28 } }
        ]}]
      },{
        Login: "Approval Row",
        Properties: { PanelTransparency: 1, Shadow: 8, Direction: "Vertical", Height: 72 },
        Layout: [{ Type: "Group", Properties: { Orientation: "Horizontal", FillHorizontal: true, FillVertical: true, Gap: 8 }, Layout: [
          { Login: "Approval Icon", Properties: { Width: 46, Height: 46, PictureTint: "#FF8A3D" } },
          { Type: "Group", Properties: { Orientation: "Vertical", FillHorizontal: true, FillVertical: true, Gap: 2 }, Layout: [
            { Login: "Approval Title", Properties: { FillHorizontal: true, FillVertical: true, TextColor: "#FFFFFF", FontSize: 17, FontWeight: 600, HorizontalAlignment: "Left", VerticalAlignment: "Bottom" } },
            { Login: "Approval Subtitle", Properties: { FillHorizontal: true, FillVertical: true, TextColor: "#8FB7D8", FontSize: 14, HorizontalAlignment: "Left", VerticalAlignment: "Top" } }
          ]},
          { Type: "Group", Properties: { Orientation: "Vertical", FillVertical: true, Gap: 2 }, Layout: [
            { Login: "Approval Amount", Properties: { FillVertical: true, TextColor: "#FF6B3D", FontSize: 18, FontWeight: 700, HorizontalAlignment: "Right", VerticalAlignment: "Bottom" } },
            { Login: "Approval Time", Properties: { FillVertical: true, TextColor: "#8FB7D8", FontSize: 14, HorizontalAlignment: "Right", VerticalAlignment: "Top" } }
          ]},
          { Login: "Approval Arrow", Properties: { Width: 18, FillVertical: true, TextColor: "#5CD5FF", FontSize: 28 } }
        ]}]
      }]
    }]
  }]
};
