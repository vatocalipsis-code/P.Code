export const setLang = {
  Name: "diagnostic-2.9.1",
  Version: 1,
  Data: [
    {
      Login: "Diagnostic Base",
      Properties: {
        Background: "#031421",
        TextColor: "#E8F2FF",
        Alignment: "Center",
        Distribution: "Center",
        Direction: "Vertical",
        Padding: 24,
        Gap: 16
      },
      Containers: [],
      SimplePanels: [
        {
          Login: "Diagnostic Simple",
          Properties: {
            Background: "#0D2D43",
            PanelTransparency: 1,
            Alignment: "Center",
            Distribution: "Center",
            Direction: "Vertical",
            Padding: 16,
            Gap: 14,
            AggregateActivePanels: []
          },
          Containers: [],
          ActivePanels: [
            {
              Login: "Diagnostic Floating",
              Properties: {
                Background: "#0D2D43",
                PanelTransparency: 1,
                Shadow: 10,
                Alignment: "Center",
                Distribution: "Center",
                Direction: "Vertical",
                Padding: 12,
                Gap: 12,
                Width: 280,
                Height: 220,
                OnPress: null,
                OffPress: null
              },
              Containers: [
                { Login: "Diagnostic Picture", Properties: { Width: 72, Height: 72 } },
                { Login: "Diagnostic Title", Properties: { TextColor: "#FFFFFF", FontSize: 28, FontWeight: 700 } },
                { Login: "Diagnostic Subtitle", Properties: { TextColor: "#A9C4E8", FontSize: 15, FontWeight: 400 } }
              ]
            }
          ]
        }
      ]
    }
  ]
};
