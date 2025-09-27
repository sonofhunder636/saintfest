'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useEffect, useRef } from 'react';

/**
 * BRACKET STRUCTURE BACKUP
 * 
 * This is a saved version of the complete HTML Canvas bracket structure.
 * Features:
 * - 32 initial lines (4 groups of 8)
 * - Round 2: 32 → 16 connections
 * - Round 3: 16 → 8 connections
 * - Round 4: 8 → 4 connections
 * - Round 5: 4 → 2 connections with offset finals
 * 
 * Structure:
 * - Left side: 2 groups (top-left, bottom-left) → 1 finalist (raised)
 * - Right side: 2 groups (top-right, bottom-right) → 1 finalist (lowered)
 * - Ready for championship connection
 */

export default function BracketStructureBackup() {
  const { currentUser, loading: authLoading } = useRequireAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 800;

    // Clear canvas with light gray background to see canvas bounds
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set line style - make lines thick and black
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;

    // Draw 32 lines in 4 groups of 8
    const lineLength = 100;
    const groupSpacing = 180; // Vertical spacing between groups
    const lineSpacing = 20;   // Spacing between lines within a group
    
    // Left side - 2 groups of 8 lines (16 total)
    const leftX = 50;
    
    // Group 1 (top-left)
    let startY = 50;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(leftX, startY + (i * lineSpacing));
      ctx.lineTo(leftX + lineLength, startY + (i * lineSpacing));
      ctx.stroke();
    }
    
    // Group 2 (bottom-left)
    startY = 50 + groupSpacing;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(leftX, startY + (i * lineSpacing));
      ctx.lineTo(leftX + lineLength, startY + (i * lineSpacing));
      ctx.stroke();
    }

    // Right side - 2 groups of 8 lines (16 total)
    const rightX = canvas.width - 50 - lineLength;
    
    // Group 3 (top-right)
    startY = 50;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(rightX, startY + (i * lineSpacing));
      ctx.lineTo(rightX + lineLength, startY + (i * lineSpacing));
      ctx.stroke();
    }
    
    // Group 4 (bottom-right)
    startY = 50 + groupSpacing;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(rightX, startY + (i * lineSpacing));
      ctx.lineTo(rightX + lineLength, startY + (i * lineSpacing));
      ctx.stroke();
    }

    // Add connecting lines for next bracket layer
    const connectorLength = 30;
    
    // Left side connectors - Group 1 (top-left)
    startY = 50;
    for (let i = 0; i < 4; i++) { // 4 pairs in each group of 8
      const line1Y = startY + (i * 2 * lineSpacing);
      const line2Y = startY + ((i * 2 + 1) * lineSpacing);
      const midY = (line1Y + line2Y) / 2;
      
      // Vertical connector between the two lines
      ctx.beginPath();
      ctx.moveTo(leftX + lineLength, line1Y);
      ctx.lineTo(leftX + lineLength, line2Y);
      ctx.stroke();
      
      // Horizontal line extending right from middle of vertical connector
      ctx.beginPath();
      ctx.moveTo(leftX + lineLength, midY);
      ctx.lineTo(leftX + lineLength + connectorLength, midY);
      ctx.stroke();
    }
    
    // Left side connectors - Group 2 (bottom-left)
    startY = 50 + groupSpacing;
    for (let i = 0; i < 4; i++) {
      const line1Y = startY + (i * 2 * lineSpacing);
      const line2Y = startY + ((i * 2 + 1) * lineSpacing);
      const midY = (line1Y + line2Y) / 2;
      
      // Vertical connector
      ctx.beginPath();
      ctx.moveTo(leftX + lineLength, line1Y);
      ctx.lineTo(leftX + lineLength, line2Y);
      ctx.stroke();
      
      // Horizontal line extending right
      ctx.beginPath();
      ctx.moveTo(leftX + lineLength, midY);
      ctx.lineTo(leftX + lineLength + connectorLength, midY);
      ctx.stroke();
    }
    
    // Right side connectors - Group 3 (top-right)
    startY = 50;
    for (let i = 0; i < 4; i++) {
      const line1Y = startY + (i * 2 * lineSpacing);
      const line2Y = startY + ((i * 2 + 1) * lineSpacing);
      const midY = (line1Y + line2Y) / 2;
      
      // Vertical connector
      ctx.beginPath();
      ctx.moveTo(rightX, line1Y);
      ctx.lineTo(rightX, line2Y);
      ctx.stroke();
      
      // Horizontal line extending left
      ctx.beginPath();
      ctx.moveTo(rightX, midY);
      ctx.lineTo(rightX - connectorLength, midY);
      ctx.stroke();
    }
    
    // Right side connectors - Group 4 (bottom-right)
    startY = 50 + groupSpacing;
    for (let i = 0; i < 4; i++) {
      const line1Y = startY + (i * 2 * lineSpacing);
      const line2Y = startY + ((i * 2 + 1) * lineSpacing);
      const midY = (line1Y + line2Y) / 2;
      
      // Vertical connector
      ctx.beginPath();
      ctx.moveTo(rightX, line1Y);
      ctx.lineTo(rightX, line2Y);
      ctx.stroke();
      
      // Horizontal line extending left
      ctx.beginPath();
      ctx.moveTo(rightX, midY);
      ctx.lineTo(rightX - connectorLength, midY);
      ctx.stroke();
    }

    // ROUND 3: Connect pairs of Round 2 lines to create Round 3 matchups
    
    // Left side - Group 1 (top-left)
    startY = 50;
    // First pair of Round 2 lines (lines 1-2 vs lines 3-4)
    const round2_1 = startY + (lineSpacing / 2); // midpoint of first pair
    const round2_2 = startY + (lineSpacing * 2) + (lineSpacing / 2); // midpoint of second pair
    let midY = (round2_1 + round2_2) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, round2_1);
    ctx.lineTo(leftX + lineLength + connectorLength, round2_2);
    ctx.stroke();
    
    // Horizontal line extending right
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, midY);
    ctx.lineTo(leftX + lineLength + connectorLength * 2, midY);
    ctx.stroke();
    
    // Second pair of Round 2 lines (lines 5-6 vs lines 7-8)
    const round2_3 = startY + (lineSpacing * 4) + (lineSpacing / 2);
    const round2_4 = startY + (lineSpacing * 6) + (lineSpacing / 2);
    midY = (round2_3 + round2_4) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, round2_3);
    ctx.lineTo(leftX + lineLength + connectorLength, round2_4);
    ctx.stroke();
    
    // Horizontal line extending right
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, midY);
    ctx.lineTo(leftX + lineLength + connectorLength * 2, midY);
    ctx.stroke();

    // Left side - Group 2 (bottom-left)
    startY = 50 + groupSpacing;
    // First pair of Round 2 lines
    const round2_5 = startY + (lineSpacing / 2);
    const round2_6 = startY + (lineSpacing * 2) + (lineSpacing / 2);
    midY = (round2_5 + round2_6) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, round2_5);
    ctx.lineTo(leftX + lineLength + connectorLength, round2_6);
    ctx.stroke();
    
    // Horizontal line extending right
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, midY);
    ctx.lineTo(leftX + lineLength + connectorLength * 2, midY);
    ctx.stroke();
    
    // Second pair of Round 2 lines
    const round2_7 = startY + (lineSpacing * 4) + (lineSpacing / 2);
    const round2_8 = startY + (lineSpacing * 6) + (lineSpacing / 2);
    midY = (round2_7 + round2_8) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, round2_7);
    ctx.lineTo(leftX + lineLength + connectorLength, round2_8);
    ctx.stroke();
    
    // Horizontal line extending right
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength, midY);
    ctx.lineTo(leftX + lineLength + connectorLength * 2, midY);
    ctx.stroke();

    // Right side - Group 3 (top-right)
    startY = 50;
    // First pair of Round 2 lines
    const round2_9 = startY + (lineSpacing / 2);
    const round2_10 = startY + (lineSpacing * 2) + (lineSpacing / 2);
    midY = (round2_9 + round2_10) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, round2_9);
    ctx.lineTo(rightX - connectorLength, round2_10);
    ctx.stroke();
    
    // Horizontal line extending left
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, midY);
    ctx.lineTo(rightX - connectorLength * 2, midY);
    ctx.stroke();
    
    // Second pair of Round 2 lines
    const round2_11 = startY + (lineSpacing * 4) + (lineSpacing / 2);
    const round2_12 = startY + (lineSpacing * 6) + (lineSpacing / 2);
    midY = (round2_11 + round2_12) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, round2_11);
    ctx.lineTo(rightX - connectorLength, round2_12);
    ctx.stroke();
    
    // Horizontal line extending left
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, midY);
    ctx.lineTo(rightX - connectorLength * 2, midY);
    ctx.stroke();

    // Right side - Group 4 (bottom-right)
    startY = 50 + groupSpacing;
    // First pair of Round 2 lines
    const round2_13 = startY + (lineSpacing / 2);
    const round2_14 = startY + (lineSpacing * 2) + (lineSpacing / 2);
    midY = (round2_13 + round2_14) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, round2_13);
    ctx.lineTo(rightX - connectorLength, round2_14);
    ctx.stroke();
    
    // Horizontal line extending left
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, midY);
    ctx.lineTo(rightX - connectorLength * 2, midY);
    ctx.stroke();
    
    // Second pair of Round 2 lines
    const round2_15 = startY + (lineSpacing * 4) + (lineSpacing / 2);
    const round2_16 = startY + (lineSpacing * 6) + (lineSpacing / 2);
    midY = (round2_15 + round2_16) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, round2_15);
    ctx.lineTo(rightX - connectorLength, round2_16);
    ctx.stroke();
    
    // Horizontal line extending left
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength, midY);
    ctx.lineTo(rightX - connectorLength * 2, midY);
    ctx.stroke();

    // ROUND 4: Connect pairs of Round 3 lines to create Round 4 matchups
    
    // Left side - Group 1 (top-left)
    startY = 50;
    const round3_1 = (startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2; // First Round 3 midpoint
    const round3_2 = (startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2; // Second Round 3 midpoint
    let round4MidY = (round3_1 + round3_2) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength * 2, round3_1);
    ctx.lineTo(leftX + lineLength + connectorLength * 2, round3_2);
    ctx.stroke();
    
    // Horizontal line extending right
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength * 2, round4MidY);
    ctx.lineTo(leftX + lineLength + connectorLength * 3, round4MidY);
    ctx.stroke();

    // Left side - Group 2 (bottom-left)
    startY = 50 + groupSpacing;
    const round3_3 = (startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2; // Third Round 3 midpoint
    const round3_4 = (startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2; // Fourth Round 3 midpoint
    round4MidY = (round3_3 + round3_4) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength * 2, round3_3);
    ctx.lineTo(leftX + lineLength + connectorLength * 2, round3_4);
    ctx.stroke();
    
    // Horizontal line extending right
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength * 2, round4MidY);
    ctx.lineTo(leftX + lineLength + connectorLength * 3, round4MidY);
    ctx.stroke();

    // Right side - Group 3 (top-right)
    startY = 50;
    const round3_5 = (startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2;
    const round3_6 = (startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2;
    round4MidY = (round3_5 + round3_6) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength * 2, round3_5);
    ctx.lineTo(rightX - connectorLength * 2, round3_6);
    ctx.stroke();
    
    // Horizontal line extending left
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength * 2, round4MidY);
    ctx.lineTo(rightX - connectorLength * 3, round4MidY);
    ctx.stroke();

    // Right side - Group 4 (bottom-right)
    startY = 50 + groupSpacing;
    const round3_7 = (startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2;
    const round3_8 = (startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2;
    round4MidY = (round3_7 + round3_8) / 2;
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength * 2, round3_7);
    ctx.lineTo(rightX - connectorLength * 2, round3_8);
    ctx.stroke();
    
    // Horizontal line extending left
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength * 2, round4MidY);
    ctx.lineTo(rightX - connectorLength * 3, round4MidY);
    ctx.stroke();

    // ROUND 5: Connect pairs of Round 4 lines to create championship matchups
    
    // Left side - Connect Group 1 and Group 2 Round 4 lines
    startY = 50;
    const leftRound4_1 = (((startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2) + ((startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2)) / 2; // Group 1 Round 4 midpoint
    
    startY = 50 + groupSpacing;
    const leftRound4_2 = (((startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2) + ((startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2)) / 2; // Group 2 Round 4 midpoint
    
    const leftFinalMidY = (leftRound4_1 + leftRound4_2) / 2;
    const leftFinalRaisedY = leftFinalMidY - 20; // Raise the left final line
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength * 3, leftRound4_1);
    ctx.lineTo(leftX + lineLength + connectorLength * 3, leftRound4_2);
    ctx.stroke();
    
    // Horizontal line extending right (raised)
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength * 3, leftFinalRaisedY);
    ctx.lineTo(leftX + lineLength + connectorLength * 4, leftFinalRaisedY);
    ctx.stroke();
    
    // Connecting line from vertical to raised horizontal
    ctx.beginPath();
    ctx.moveTo(leftX + lineLength + connectorLength * 3, leftFinalMidY);
    ctx.lineTo(leftX + lineLength + connectorLength * 3, leftFinalRaisedY);
    ctx.stroke();

    // Right side - Connect Group 3 and Group 4 Round 4 lines
    startY = 50;
    const rightRound4_1 = (((startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2) + ((startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2)) / 2; // Group 3 Round 4 midpoint
    
    startY = 50 + groupSpacing;
    const rightRound4_2 = (((startY + (lineSpacing / 2) + startY + (lineSpacing * 2) + (lineSpacing / 2)) / 2) + ((startY + (lineSpacing * 4) + (lineSpacing / 2) + startY + (lineSpacing * 6) + (lineSpacing / 2)) / 2)) / 2; // Group 4 Round 4 midpoint
    
    const rightFinalMidY = (rightRound4_1 + rightRound4_2) / 2;
    const rightFinalLoweredY = rightFinalMidY + 20; // Lower the right final line
    
    // Vertical connector
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength * 3, rightRound4_1);
    ctx.lineTo(rightX - connectorLength * 3, rightRound4_2);
    ctx.stroke();
    
    // Horizontal line extending left (lowered)
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength * 3, rightFinalLoweredY);
    ctx.lineTo(rightX - connectorLength * 4, rightFinalLoweredY);
    ctx.stroke();
    
    // Connecting line from vertical to lowered horizontal
    ctx.beginPath();
    ctx.moveTo(rightX - connectorLength * 3, rightFinalMidY);
    ctx.lineTo(rightX - connectorLength * 3, rightFinalLoweredY);
    ctx.stroke();

  }, []);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl font-bold mb-4">Bracket Structure Backup</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <canvas 
            ref={canvasRef}
            width={1200}
            height={800}
            className="border border-gray-300"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
}