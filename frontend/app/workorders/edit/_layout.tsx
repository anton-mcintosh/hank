// frontend/app/workorders/edit/_layout.tsx
import { Stack } from 'expo-router';
import React from 'react';

export default function WorkOrderEditLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
