import NominaMensual from '@features/nomina/nominas/NominaMensual.tsx';
import React from 'react';

type AnyRecord = Record<string, any>;

export default function NominaTab(props: AnyRecord) {
  return <NominaMensual {...props} />;
}


