export const setLang = {
  Name: "transparent-two-row-proof",
  Version: 1,
  Data: [
    {
      Login: "Proof Base",
      Properties: {
        Background: "#031421",
        TextColor: "#E8F2FF",
        Alignment: "Stretch",
        Distribution: "Start",
        Direction: "Vertical",
        Padding: 18,
        Gap: 22
      },
      Containers: [],
      SimplePanels: [
        {
          Login: "Cash Section",
          Properties: {
            PanelTransparency: 1,
            Alignment: "Stretch",
            Distribution: "Start",
            Direction: "Vertical",
            Gap: 10,
            AggregateActivePanels: []
          },
          Containers: [
            {
              Login: "Cash Section Title",
              Properties: {
                TextColor: "#43D6FF",
                FontSize: 18,
                FontWeight: 700,
                Distribution: "Start"
              }
            }
          ],
          ActivePanels: [
            {
              Login: "Main Cash Row",
              Properties: {
                PanelTransparency: 1,
                Shadow: 7,
                Alignment: "Start",
                Distribution: "Start",
                Direction: "Horizontal",
                Gap: 8,
                Height: 68,
                OnPress: null,
                OffPress: null
              },
              Containers: [
                {
                  Login: "Main Icon",
                  Properties: {
                    Width: 46,
                    Height: 46,
                    PictureTint: "#20F5B0",
                    Orientation: "Horizontal",
                    Flip: false
                  }
                },
                {
                  Login: "Main Name",
                  Properties: {
                    TextColor: "#FFFFFF",
                    FontSize: 18,
                    FontWeight: 600,
                    Distribution: "Start",
                    Orientation: "Vertical",
                    Flip: true
                  }
                },
                {
                  Login: "Main Meta",
                  Properties: {
                    TextColor: "#8FB7D8",
                    FontSize: 14,
                    FontWeight: 400,
                    Distribution: "Start",
                    Orientation: "Horizontal",
                    Flip: false
                  }
                },
                {
                  Login: "Main Amount",
                  Properties: {
                    TextColor: "#20F5B0",
                    FontSize: 19,
                    FontWeight: 700,
                    Distribution: "End",
                    Orientation: "Vertical",
                    Flip: false
                  }
                },
                {
                  Login: "Main Currency",
                  Properties: {
                    TextColor: "#8FB7D8",
                    FontSize: 14,
                    FontWeight: 500,
                    Distribution: "End",
                    Orientation: "Horizontal",
                    Flip: false
                  }
                },
                {
                  Login: "Main Arrow",
                  Properties: {
                    TextColor: "#5CD5FF",
                    FontSize: 28,
                    FontWeight: 400,
                    Width: 18,
                    Distribution: "End"
                  }
                }
              ]
            }
          ]
        },
        {
          Login: "Approval Section",
          Properties: {
            PanelTransparency: 1,
            Alignment: "Stretch",
            Distribution: "Start",
            Direction: "Vertical",
            Gap: 10,
            AggregateActivePanels: []
          },
          Containers: [
            {
              Login: "Approval Section Title",
              Properties: {
                TextColor: "#43D6FF",
                FontSize: 18,
                FontWeight: 700,
                Distribution: "Start"
              }
            }
          ],
          ActivePanels: [
            {
              Login: "Approval Row",
              Properties: {
                PanelTransparency: 1,
                Shadow: 8,
                Alignment: "Start",
                Distribution: "Start",
                Direction: "Horizontal",
                Gap: 8,
                Height: 72,
                OnPress: null,
                OffPress: null
              },
              Containers: [
                {
                  Login: "Approval Icon",
                  Properties: {
                    Width: 46,
                    Height: 46,
                    PictureTint: "#FF8A3D",
                    Orientation: "Horizontal",
                    Flip: false
                  }
                },
                {
                  Login: "Approval Title",
                  Properties: {
                    TextColor: "#FFFFFF",
                    FontSize: 17,
                    FontWeight: 600,
                    Distribution: "Start",
                    Orientation: "Vertical",
                    Flip: true
                  }
                },
                {
                  Login: "Approval Subtitle",
                  Properties: {
                    TextColor: "#8FB7D8",
                    FontSize: 14,
                    FontWeight: 400,
                    Distribution: "Start",
                    Orientation: "Horizontal",
                    Flip: false
                  }
                },
                {
                  Login: "Approval Amount",
                  Properties: {
                    TextColor: "#FF6B3D",
                    FontSize: 18,
                    FontWeight: 700,
                    Distribution: "End",
                    Orientation: "Vertical",
                    Flip: false
                  }
                },
                {
                  Login: "Approval Time",
                  Properties: {
                    TextColor: "#8FB7D8",
                    FontSize: 14,
                    FontWeight: 400,
                    Distribution: "End",
                    Orientation: "Horizontal",
                    Flip: false
                  }
                },
                {
                  Login: "Approval Arrow",
                  Properties: {
                    TextColor: "#5CD5FF",
                    FontSize: 28,
                    FontWeight: 400,
                    Width: 18,
                    Distribution: "End"
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};
