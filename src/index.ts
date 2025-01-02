import { ExtensionContext } from "@foxglove/extension";
import { PointCloud, NumericType } from "@foxglove/schemas";
import { Time } from "@foxglove/schemas/schemas/typescript/Time";

type Header = Readonly<{
  frame_id: string;
  stamp: Time;
}>;

type LivoxCustomPoint = {
  x: number;
  y: number;
  z: number;
  reflectivity: number;
  tag: number;
  line: number;
};

type LivoxCustomMsg = {
  header: Header;
  points: LivoxCustomPoint[];
};

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerMessageConverter({
    fromSchemaName: "livox_ros_driver2/msg/CustomMsg",
    toSchemaName: "foxglove.PointCloud",
    converter: (inputMessage: LivoxCustomMsg): PointCloud => {
      const numPoints = inputMessage.points.length;
      const stride = 15; // point_stride value
      const buffer = new ArrayBuffer(numPoints * stride);
      const dataView = new DataView(buffer);
      inputMessage.points.forEach((point, index) => {
        const offset = index * stride;
        // Write float32 values
        dataView.setFloat32(offset + 0, point.x, true);
        dataView.setFloat32(offset + 4, point.y, true);
        dataView.setFloat32(offset + 8, point.z, true);
        // Write uint8 values
        dataView.setUint8(offset + 12, point.reflectivity);
        dataView.setUint8(offset + 13, point.tag);
        dataView.setUint8(offset + 14, point.line);
      });

      return {
        timestamp: inputMessage.header.stamp,
        frame_id: inputMessage.header.frame_id,
        pose: {
          position: { x: 0, y: 0, z: 0 },
          orientation: { x: 0, y: 0, z: 0, w: 1 },
        },
        point_stride: stride,
        fields: [
          { name: "x", offset: 0, type: NumericType.FLOAT32 },
          { name: "y", offset: 4, type: NumericType.FLOAT32 },
          { name: "z", offset: 8, type: NumericType.FLOAT32 },
          { name: "reflectivity", offset: 12, type: NumericType.UINT8 },
          { name: "tag", offset: 13, type: NumericType.UINT8 },
          { name: "line", offset: 14, type: NumericType.UINT8 },
        ],
        data: new Uint8Array(buffer),
      };
    },
  });
}
