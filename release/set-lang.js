export const setLang = {
  Name: "reference model",
  Version: 1,
  Data: [
    {
      Login: "Reference Surface",
      Properties: {
        Background: "#07131D", BorderColor: "#21465D", BorderWidth: 1,
        TextColor: "#EAF4FA", Padding: 12, Gap: 10,
        Alignment: "Stretch", Distribution: "Start", Direction: "Vertical"
      },
      Containers: [],
      SimplePanels: [
        {
          Login: "Reference Header",
          Properties: {
            Background: "#0C2130", BorderColor: "#28536C", BorderWidth: 1,
            Padding: 8, Gap: 8, Alignment: "Center",
            Distribution: "Between", Direction: "Horizontal",
            AggregateActivePanels: []
          },
          Containers: [],
          ActivePanels: [
            {
              Login: "PlaneCode Title",
              Properties: {
                Background: "#123249", BorderColor: "#34708F", BorderWidth: 1,
                Height: 44, Padding: 8, Gap: 6, Alignment: "Center",
                Distribution: "Start", Direction: "Horizontal", Parallax: 1.5,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "PlaneCode Mark", Properties: { Width: 26, Height: 26, PictureTint: "#59E1C4" } },
                { Login: "PlaneCode Name", Properties: { TextColor: "#F3FAFD", FontSize: 18, FontWeight: 700 } }
              ]
            },
            {
              Login: "Reference Menu",
              Properties: {
                Background: "#123249", BorderColor: "#34708F", BorderWidth: 1,
                Width: 44, Height: 44, Padding: 8, Alignment: "Center",
                Distribution: "Center", Direction: "Horizontal", Parallax: 2,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "Reference Menu Icon", Properties: { Width: 26, Height: 26, PictureTint: "#F3C96B" } }
              ]
            }
          ]
        },
        {
          Login: "Hierarchy Lab",
          Properties: {
            Background: "#0A1C29", BorderColor: "#234A61", BorderWidth: 1,
            Padding: 9, Gap: 7, Alignment: "Stretch",
            Distribution: "Start", Direction: "Vertical",
            AggregateActivePanels: [
              {
                Login: "Hierarchy Aggregate",
                Properties: {
                  Background: "#163B50", BorderColor: "#3B7896", BorderWidth: 1,
                  Padding: 6, Gap: 6, Alignment: "Center",
                  Distribution: "Start", Direction: "Horizontal", Parallax: 1,
                  OnPress: null, OffPress: null
                },
                Containers: [
                  { Login: "Hierarchy Aggregate Icon", Properties: { Width: 22, Height: 22, PictureTint: "#72D8FF" } },
                  { Login: "Hierarchy Aggregate Text", Properties: { TextColor: "#DDF5FF", FontSize: 15, FontWeight: 650 } }
                ]
              }
            ]
          },
          Containers: [],
          ActivePanels: [
            {
              Login: "Horizontal Active",
              Properties: {
                Background: "#103047", BorderColor: "#2D6685", BorderWidth: 1,
                Height: 62, Padding: 8, Gap: 8, Alignment: "Center",
                Distribution: "Between", Direction: "Horizontal", Parallax: 2.5,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "Horizontal Icon", Properties: { Width: 30, Height: 30, PictureTint: "#8CE8B9" } },
                { Login: "Horizontal Text", Properties: { TextColor: "#EAFBF2", FontSize: 15, FontWeight: 600 } },
                { Login: "Horizontal Value", Properties: { TextColor: "#FFFFFF", FontSize: 20, FontWeight: 750 } }
              ]
            },
            {
              Login: "Vertical Active",
              Properties: {
                Background: "#132D42", BorderColor: "#345E7B",
                BorderLeftColor: "#68D6FF", BorderLeftWidth: 3,
                BorderRightWidth: 1, BorderTopWidth: 1, BorderBottomWidth: 1,
                Height: 72, Padding: 8, Gap: 2, Alignment: "Start",
                Distribution: "Center", Direction: "Vertical", Parallax: 3,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "Vertical Label", Properties: { TextColor: "#9FC4D8", FontSize: 13, FontWeight: 500 } },
                { Login: "Vertical Value", Properties: { TextColor: "#FFFFFF", FontSize: 23, FontWeight: 750 } }
              ]
            }
          ]
        },
        {
          Login: "Media Lab",
          Properties: {
            Background: "#0A1C29", BorderColor: "#234A61", BorderWidth: 1,
            Padding: 9, Gap: 7, Alignment: "Stretch",
            Distribution: "Start", Direction: "Vertical",
            AggregateActivePanels: [
              {
                Login: "Media Aggregate",
                Properties: {
                  Background: "#163B50", BorderColor: "#3B7896", BorderWidth: 1,
                  Padding: 6, Alignment: "Center", Distribution: "Start",
                  Direction: "Horizontal", OnPress: null, OffPress: null
                },
                Containers: [
                  { Login: "Media Aggregate Text", Properties: { TextColor: "#DDF5FF", FontSize: 15, FontWeight: 650 } }
                ]
              }
            ]
          },
          Containers: [],
          ActivePanels: [
            {
              Login: "Media Active",
              Properties: {
                Background: "#103047", BorderColor: "#2D6685", BorderWidth: 1,
                Height: 62, Padding: 8, Gap: 10, Alignment: "Center",
                Distribution: "Start", Direction: "Horizontal", Parallax: 2,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "Media Picture", Properties: { Width: 34, Height: 34, PictureTint: "#FFB66E" } },
                { Login: "Media Text", Properties: { TextColor: "#FFF0E1", FontSize: 15, FontWeight: 600 } }
              ]
            }
          ]
        }
      ]
    },
    {
      Login: "Layout Surface",
      Properties: {
        Background: "#10141B", BorderColor: "#3A4654", BorderWidth: 1,
        TextColor: "#F0F3F6", Padding: 12, Gap: 10,
        Alignment: "Stretch", Distribution: "Start", Direction: "Vertical"
      },
      Containers: [],
      SimplePanels: [
        {
          Login: "Layout Header",
          Properties: {
            Background: "#1B232D", BorderColor: "#46586A", BorderWidth: 1,
            Padding: 9, Gap: 6, Alignment: "Center",
            Distribution: "Between", Direction: "Horizontal",
            AggregateActivePanels: []
          },
          Containers: [
            { Login: "Layout Title", Properties: { TextColor: "#FFFFFF", FontSize: 18, FontWeight: 700 } },
            { Login: "Layout Page", Properties: { TextColor: "#9FB1C3", FontSize: 13, FontWeight: 600 } }
          ],
          ActivePanels: []
        },
        {
          Login: "Distribution Lab",
          Properties: {
            Background: "#181F28", BorderColor: "#3B4A59", BorderWidth: 1,
            Padding: 9, Gap: 8, Alignment: "Stretch",
            Distribution: "Start", Direction: "Vertical",
            AggregateActivePanels: [
              {
                Login: "Distribution Aggregate",
                Properties: {
                  Background: "#263342", BorderColor: "#526A80", BorderWidth: 1,
                  Padding: 6, Alignment: "Center", Distribution: "Start",
                  Direction: "Horizontal", OnPress: null, OffPress: null
                },
                Containers: [
                  { Login: "Distribution Title", Properties: { TextColor: "#EAF1F7", FontSize: 15, FontWeight: 650 } }
                ]
              }
            ]
          },
          Containers: [],
          ActivePanels: [
            {
              Login: "Between Active",
              Properties: {
                Background: "#202B36", BorderColor: "#526578", BorderWidth: 1,
                Height: 58, Padding: 8, Gap: 6, Alignment: "Center",
                Distribution: "Between", Direction: "Horizontal", Parallax: 1.5,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "Between A", Properties: { TextColor: "#7EE7D0", FontSize: 14, FontWeight: 700 } },
                { Login: "Between B", Properties: { TextColor: "#FFD47E", FontSize: 14, FontWeight: 700 } },
                { Login: "Between C", Properties: { TextColor: "#8FC5FF", FontSize: 14, FontWeight: 700 } }
              ]
            },
            {
              Login: "Centered Active",
              Properties: {
                Background: "#202B36", BorderColor: "#526578", BorderWidth: 1,
                Height: 58, Padding: 8, Gap: 12, Alignment: "Center",
                Distribution: "Center", Direction: "Horizontal", Parallax: 2.5,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "Center Picture", Properties: { Width: 28, Height: 28, PictureTint: "#D79BFF" } },
                { Login: "Center Text", Properties: { TextColor: "#F1DEFF", FontSize: 15, FontWeight: 650 } }
              ]
            }
          ]
        },
        {
          Login: "Typography Lab",
          Properties: {
            Background: "#181F28", BorderColor: "#3B4A59", BorderWidth: 1,
            Padding: 9, Gap: 6, Alignment: "Stretch",
            Distribution: "Start", Direction: "Vertical",
            AggregateActivePanels: [
              {
                Login: "Typography Aggregate",
                Properties: {
                  Background: "#263342", BorderColor: "#526A80", BorderWidth: 1,
                  Padding: 6, Alignment: "Center", Distribution: "Start",
                  Direction: "Horizontal", OnPress: null, OffPress: null
                },
                Containers: [
                  { Login: "Typography Title", Properties: { TextColor: "#EAF1F7", FontSize: 15, FontWeight: 650 } }
                ]
              }
            ]
          },
          Containers: [],
          ActivePanels: [
            {
              Login: "Typography Active",
              Properties: {
                Background: "#202B36", BorderColor: "#526578", BorderWidth: 1,
                Height: 74, Padding: 8, Gap: 2, Alignment: "Start",
                Distribution: "Center", Direction: "Vertical", Parallax: 2,
                OnPress: null, OffPress: null
              },
              Containers: [
                { Login: "Type Small", Properties: { TextColor: "#A9B8C6", FontSize: 12, FontWeight: 400 } },
                { Login: "Type Medium", Properties: { TextColor: "#F1F5F8", FontSize: 16, FontWeight: 600 } },
                { Login: "Type Large", Properties: { TextColor: "#FFFFFF", FontSize: 22, FontWeight: 800 } }
              ]
            }
          ]
        }
      ]
    }
  ]
};
