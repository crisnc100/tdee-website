'use client';

import React from 'react';
import AICoachInterface from './AICoachInterface';

interface AICoachingProps {
  userData: any;
  tdeeResult: any;
}

export default function AICoaching({ userData, tdeeResult }: AICoachingProps) {
  return <AICoachInterface userData={userData} tdeeResult={tdeeResult} />;
}