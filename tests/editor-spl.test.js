
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSPL, serializeSPL } from '../editor/spl.js';

const legacy = `
SetLang {
  Name = "legacy"
  Version = 1
  Data {
    BasePanel "Base" {
      Properties { Background = "#010203" Direction = "Vertical" }
      Containers [
        Container "Title" { Properties { TextColor = "#ffffff" FontSize = 18 } }
      ]
      SimplePanels [
        SimplePanel "Surface" {
          Properties { Direction = "Vertical" }
          AggregateActivePanels [
            AggregateActivePanel "Aggregate" {
              Properties { Direction = "Horizontal" OnPress = null OffPress = null }
              Containers [ ]
            }
          ]
          Containers [ ]
          ActivePanels [ ]
        }
      ]
    }
  }
}
SetData {
  Name = "data"
  Version = 1
  Data { "Title" { SourceText = "Hello" } }
}
SetRender {
  Name = "scene"
  Version = 1
  Data {
    PanelSpacing = 4
    BackgroundColor = "#000000"
    PanelColor = "#111111"
    BorderColor = "#222222"
    TextColor = "#ffffff"
    Transparency = 0
    TextTransparency = 0
    PictureTransparency = 0
    Parallax = 0
  }
}`;

const current = `
SetLang {
  Name = "current"
  Version = 1
  Data {
    BasePanel "Base" {
      Properties { Direction = "Vertical" }
      Layout [
        Group {
          Properties { Orientation = "Horizontal" FillHorizontal = true Gap = 6 }
          Layout [
            Container "Name" { Properties { FillHorizontal = true TextColor = "#ffffff" } }
          ]
        }
        EditableInput "Search" {
          Properties { InputType = "Text" Width = 160 FillHorizontal = true }
        }
      ]
      SimplePanels [ ]
    }
  }
}
SetData {
  Name = "data"
  Version = 1
  Data {
    "Name" { SourceText = "Cash" }
    "Search" {
      InputValue = ""
      ValidationState { Status = "None" Message = "" }
    }
  }
}
SetRender {
  Name = "scene"
  Version = 1
  Data { Transparency = 0 TextTransparency = 0 PictureTransparency = 0 Parallax = 0 }
}`;

test('parseSPL opens legacy typed SPL and normalizes AggregateActivePanels to current SimplePanel.Properties', () => {
  const project = parseSPL(legacy);
  assert.equal(project.SetLang.Name, 'legacy');
  assert.equal(project.SetData.Data.Title.SourceText, 'Hello');
  assert.equal(project.SetLang.Data[0].SimplePanels[0].Properties.AggregateActivePanels[0].Login, 'Aggregate');
});

test('serializeSPL round-trips SetLang, SetData and SetRender without changing data values', () => {
  const first = parseSPL(current);
  const text = serializeSPL(first);
  const second = parseSPL(text);
  assert.deepEqual(second, first);
  assert.equal(second.SetLang.Data[0].Layout[0].Type, 'Group');
  assert.equal(second.SetLang.Data[0].Layout[1].Type, 'EditableInput');
  assert.equal(second.SetData.Data.Search.ValidationState.Status, 'None');
});

test('parser rejects plans missing one of the three independent Sets', () => {
  assert.throws(() => parseSPL(`SetLang { Name="x" Version=1 Data { } }`), /missing SetData/);
});
