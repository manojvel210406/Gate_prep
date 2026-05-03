/**
 * Database Seeder - Seeds subjects and topics for GATE EEE curriculum
 * Run: node utils/seeder.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');

const subjects = [
  { name: 'Circuit Theory', code: 'CT', stageLevel: 1, color: '#1e40af', icon: '⚡', weightageInGATE: 15, estimatedHours: 60, order: 1, description: 'KVL, KCL, network theorems, transient analysis' },
  { name: 'Signals & Control Systems', code: 'SCS', stageLevel: 2, color: '#065f46', icon: '📡', weightageInGATE: 18, estimatedHours: 70, order: 2, description: 'Laplace, Fourier, Z-transform, stability, feedback' },
  { name: 'Electrical Machines', code: 'EM', stageLevel: 3, color: '#92400e', icon: '🔧', weightageInGATE: 14, estimatedHours: 55, order: 3, description: 'DC machines, transformers, induction motors, synchronous machines' },
  { name: 'Power Electronics', code: 'PE', stageLevel: 4, color: '#7c3aed', icon: '🔋', weightageInGATE: 12, estimatedHours: 50, order: 4, description: 'Rectifiers, inverters, choppers, converters, PWM' },
  { name: 'Power Systems', code: 'PS', stageLevel: 5, color: '#be185d', icon: '🏭', weightageInGATE: 16, estimatedHours: 65, order: 5, description: 'Load flow, fault analysis, protection, stability' },
  { name: 'Engineering Mathematics', code: 'MATH', stageLevel: 1, color: '#0A3D62', icon: '📐', weightageInGATE: 13, estimatedHours: 45, order: 0, description: 'Linear algebra, calculus, complex analysis, probability' },
  { name: 'Analog Circuits', code: 'AC', stageLevel: 2, color: '#d97706', icon: '🔬', weightageInGATE: 8, estimatedHours: 40, order: 3, description: 'Diodes, BJT, MOSFET, op-amps, oscillators' },
  { name: 'Digital Circuits', code: 'DC', stageLevel: 2, color: '#059669', icon: '💾', weightageInGATE: 4, estimatedHours: 30, order: 4, description: 'Logic gates, flip-flops, counters, memory, ADC/DAC' },
];

const topicsData = [
  // Circuit Theory (Stage 1)
  { subjectCode: 'CT', name: 'KVL and KCL', difficulty: 'easy', gateWeightage: 2, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 4, order: 1, pyqYears: [2023, 2022, 2021, 2020], isFrequentlyAsked: true, keyFormulas: ['ΣV=0 (loop)', 'ΣI=0 (node)'], keyConcepts: ['Loop analysis', 'Nodal analysis', 'Mesh analysis'] },
  { subjectCode: 'CT', name: 'Network Theorems', difficulty: 'medium', gateWeightage: 3, pyqFrequency: 10, priority: 'critical', estimatedStudyHours: 6, order: 2, pyqYears: [2023,2022,2021,2020,2019], isFrequentlyAsked: true, keyFormulas: ['Thevenin: V_th/R_th', 'Norton: I_N/R_N'], keyConcepts: ['Thevenin', 'Norton', 'Superposition', 'Maximum power transfer'] },
  { subjectCode: 'CT', name: 'Transient Analysis (RL/RC/RLC)', difficulty: 'hard', gateWeightage: 3, pyqFrequency: 9, priority: 'high', estimatedStudyHours: 8, order: 3, pyqYears: [2023,2022,2021], isFrequentlyAsked: true },
  { subjectCode: 'CT', name: 'Phasor Analysis & AC Circuits', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 4 },
  { subjectCode: 'CT', name: 'Two-Port Networks', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 6, priority: 'medium', estimatedStudyHours: 5, order: 5 },
  { subjectCode: 'CT', name: 'Resonance Circuits', difficulty: 'medium', gateWeightage: 1, pyqFrequency: 5, priority: 'medium', estimatedStudyHours: 3, order: 6 },
  { subjectCode: 'CT', name: 'Graph Theory & Network Analysis', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 4, priority: 'low', estimatedStudyHours: 4, order: 7 },
  { subjectCode: 'CT', name: 'Magnetically Coupled Circuits', difficulty: 'medium', gateWeightage: 1, pyqFrequency: 4, priority: 'medium', estimatedStudyHours: 3, order: 8 },

  // Signals & Control (Stage 2)
  { subjectCode: 'SCS', name: 'Laplace Transform', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 6, order: 1, isFrequentlyAsked: true },
  { subjectCode: 'SCS', name: 'Fourier Series & Transform', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 6, order: 2, isFrequentlyAsked: true },
  { subjectCode: 'SCS', name: 'Z-Transform', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 3 },
  { subjectCode: 'SCS', name: 'Transfer Functions & Block Diagrams', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 5, order: 4, isFrequentlyAsked: true },
  { subjectCode: 'SCS', name: 'Time Domain Analysis (Transient)', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 8, priority: 'high', estimatedStudyHours: 6, order: 5 },
  { subjectCode: 'SCS', name: 'Frequency Response (Bode Plot)', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 6 },
  { subjectCode: 'SCS', name: 'Routh-Hurwitz Stability Criterion', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 4, order: 7, isFrequentlyAsked: true },
  { subjectCode: 'SCS', name: 'Root Locus Method', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 8 },
  { subjectCode: 'SCS', name: 'Nyquist Criterion', difficulty: 'hard', gateWeightage: 1, pyqFrequency: 6, priority: 'medium', estimatedStudyHours: 4, order: 9 },
  { subjectCode: 'SCS', name: 'State Space Analysis', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 6, order: 10 },

  // Electrical Machines (Stage 3)
  { subjectCode: 'EM', name: 'DC Machine Fundamentals', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 1 },
  { subjectCode: 'EM', name: 'DC Motor Characteristics', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 5, order: 2, isFrequentlyAsked: true },
  { subjectCode: 'EM', name: 'Transformer Theory & Equivalent Circuit', difficulty: 'medium', gateWeightage: 3, pyqFrequency: 10, priority: 'critical', estimatedStudyHours: 7, order: 3, isFrequentlyAsked: true },
  { subjectCode: 'EM', name: 'Transformer Tests & Efficiency', difficulty: 'easy', gateWeightage: 2, pyqFrequency: 8, priority: 'high', estimatedStudyHours: 4, order: 4 },
  { subjectCode: 'EM', name: '3-Phase Induction Motor', difficulty: 'hard', gateWeightage: 3, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 8, order: 5, isFrequentlyAsked: true },
  { subjectCode: 'EM', name: 'Induction Motor Speed Control', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 6 },
  { subjectCode: 'EM', name: 'Synchronous Machine Fundamentals', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 8, priority: 'high', estimatedStudyHours: 6, order: 7 },
  { subjectCode: 'EM', name: 'Synchronous Motor V-Curves', difficulty: 'medium', gateWeightage: 1, pyqFrequency: 5, priority: 'medium', estimatedStudyHours: 3, order: 8 },

  // Power Electronics (Stage 4)
  { subjectCode: 'PE', name: 'Power Semiconductor Devices (SCR, MOSFET, IGBT)', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 5, order: 1, isFrequentlyAsked: true },
  { subjectCode: 'PE', name: 'Controlled Rectifiers', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 6, order: 2, isFrequentlyAsked: true },
  { subjectCode: 'PE', name: 'DC-DC Converters (Buck, Boost, Buck-Boost)', difficulty: 'hard', gateWeightage: 3, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 7, order: 3, isFrequentlyAsked: true },
  { subjectCode: 'PE', name: 'Inverters (Single & Three Phase)', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 8, priority: 'high', estimatedStudyHours: 6, order: 4 },
  { subjectCode: 'PE', name: 'PWM Techniques', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 4, order: 5 },
  { subjectCode: 'PE', name: 'AC Voltage Controllers', difficulty: 'medium', gateWeightage: 1, pyqFrequency: 5, priority: 'medium', estimatedStudyHours: 3, order: 6 },

  // Power Systems (Stage 5)
  { subjectCode: 'PS', name: 'Per Unit System', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 4, order: 1, isFrequentlyAsked: true },
  { subjectCode: 'PS', name: 'Load Flow Analysis', difficulty: 'hard', gateWeightage: 3, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 7, order: 2 },
  { subjectCode: 'PS', name: 'Symmetrical Fault Analysis', difficulty: 'hard', gateWeightage: 3, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 7, order: 3, isFrequentlyAsked: true },
  { subjectCode: 'PS', name: 'Unsymmetrical Faults (Sequence Networks)', difficulty: 'hard', gateWeightage: 3, pyqFrequency: 8, priority: 'high', estimatedStudyHours: 8, order: 4 },
  { subjectCode: 'PS', name: 'Power System Stability', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 6, order: 5 },
  { subjectCode: 'PS', name: 'Transmission Lines', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 8, priority: 'high', estimatedStudyHours: 5, order: 6 },
  { subjectCode: 'PS', name: 'Power System Protection', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 7 },

  // Engineering Mathematics
  { subjectCode: 'MATH', name: 'Linear Algebra', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 9, priority: 'critical', estimatedStudyHours: 6, order: 1, isFrequentlyAsked: true },
  { subjectCode: 'MATH', name: 'Differential Equations', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 5, order: 2 },
  { subjectCode: 'MATH', name: 'Complex Variables', difficulty: 'hard', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 3 },
  { subjectCode: 'MATH', name: 'Probability & Statistics', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 7, priority: 'high', estimatedStudyHours: 5, order: 4 },
  { subjectCode: 'MATH', name: 'Numerical Methods', difficulty: 'medium', gateWeightage: 1, pyqFrequency: 5, priority: 'medium', estimatedStudyHours: 4, order: 5 },

  // Analog Circuits
  { subjectCode: 'AC', name: 'Diodes & Applications', difficulty: 'easy', gateWeightage: 1, pyqFrequency: 5, priority: 'medium', estimatedStudyHours: 3, order: 1 },
  { subjectCode: 'AC', name: 'BJT Biasing & Amplifiers', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 6, priority: 'high', estimatedStudyHours: 5, order: 2 },
  { subjectCode: 'AC', name: 'MOSFET Amplifiers', difficulty: 'medium', gateWeightage: 2, pyqFrequency: 6, priority: 'high', estimatedStudyHours: 4, order: 3 },
  { subjectCode: 'AC', name: 'Op-Amp Applications', difficulty: 'easy', gateWeightage: 2, pyqFrequency: 8, priority: 'critical', estimatedStudyHours: 4, order: 4, isFrequentlyAsked: true },
  { subjectCode: 'AC', name: 'Oscillators & Feedback', difficulty: 'hard', gateWeightage: 1, pyqFrequency: 5, priority: 'medium', estimatedStudyHours: 4, order: 5 },

  // Digital Circuits
  { subjectCode: 'DC', name: 'Boolean Algebra & Logic Gates', difficulty: 'easy', gateWeightage: 1, pyqFrequency: 5, priority: 'high', estimatedStudyHours: 3, order: 1 },
  { subjectCode: 'DC', name: 'Combinational Circuits', difficulty: 'easy', gateWeightage: 1, pyqFrequency: 5, priority: 'high', estimatedStudyHours: 3, order: 2 },
  { subjectCode: 'DC', name: 'Sequential Circuits & Flip-Flops', difficulty: 'medium', gateWeightage: 1, pyqFrequency: 5, priority: 'high', estimatedStudyHours: 4, order: 3 },
  { subjectCode: 'DC', name: 'ADC & DAC', difficulty: 'medium', gateWeightage: 1, pyqFrequency: 4, priority: 'medium', estimatedStudyHours: 3, order: 4 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gate_eee_db');
    console.log('✅ Connected to MongoDB');

    // Clear existing
    await Subject.deleteMany({});
    await Topic.deleteMany({});
    console.log('🗑️  Cleared existing subjects and topics');

    // Insert subjects
    const insertedSubjects = await Subject.insertMany(subjects);
    console.log(`✅ Inserted ${insertedSubjects.length} subjects`);

    // Map subject codes to IDs
    const subjectMap = {};
    insertedSubjects.forEach(s => { subjectMap[s.code] = s._id; });

    // Insert topics
    const topicsWithIds = topicsData.map(t => ({
      ...t,
      subjectId: subjectMap[t.subjectCode],
      code: `${t.subjectCode}-${t.order.toString().padStart(2, '0')}`,
    })).filter(t => t.subjectId);

    // Remove subjectCode field
    topicsWithIds.forEach(t => delete t.subjectCode);

    const insertedTopics = await Topic.insertMany(topicsWithIds);
    console.log(`✅ Inserted ${insertedTopics.length} topics`);

    // Update subject totalTopics
    for (const sub of insertedSubjects) {
      const count = await Topic.countDocuments({ subjectId: sub._id });
      await Subject.findByIdAndUpdate(sub._id, { totalTopics: count });
    }

    console.log('🎉 Database seeding complete!');
    console.log(`📊 Total: ${insertedSubjects.length} subjects, ${insertedTopics.length} topics`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
