$(document).ready(function () {
  setTimeout(function () {
    $("#splashScreen").hide();
    $("#mainContent").show();
  }, 4000); // 4000 milliseconds
});

function solve() {
  const algorithm = document.getElementById("algorithm").value;
  const arrivalTimes = document.getElementById("arrivalTime").value.split(" ").map(Number);
  const burstTimes = document.getElementById("burstTime").value.split(" ").map(Number);

  if (arrivalTimes.length !== burstTimes.length) {
    alert("Number of arrival times must match number of burst times.");
    return;
  }

  let outputHTML = generateTableHeader();
  let finishTimes = [];
  let totalWaitingTime = 0;

  switch (algorithm) {
    case "FCFS":
      ({ finishTimes, totalWaitingTime } = fcfs(arrivalTimes, burstTimes));
      break;
    case "SJF":
      ({ finishTimes, totalWaitingTime } = sjf(arrivalTimes, burstTimes));
      break;
    case "SRTF":
      ({ finishTimes, totalWaitingTime } = srtf(arrivalTimes, burstTimes));
      break;
    case "RR":
      const timeQuantum = prompt("Enter time quantum for Round Robin:");
      if (!isValidTimeQuantum(timeQuantum)) return;
      ({ finishTimes, totalWaitingTime } = rr(arrivalTimes, burstTimes, parseInt(timeQuantum)));
      break;
    default:
      alert("Invalid algorithm selected.");
      return;
  }

  outputHTML += generateTableRows(arrivalTimes, burstTimes, finishTimes);
  outputHTML += generateTableFooter(arrivalTimes, finishTimes, totalWaitingTime);
  outputHTML += `</table>`;

  document.getElementById("output").innerHTML = outputHTML;
}

function generateTableHeader() {
  return `
    <table>
      <tr>
        <th>Job</th>
        <th>Arrival Time</th>
        <th>Burst Time</th>
        <th>Finish Time</th>
        <th>Turnaround Time</th>
        <th>Waiting Time</th>
      </tr>
  `;
}

function generateTableRows(arrivalTimes, burstTimes, finishTimes) {
  return arrivalTimes.map((at, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${at}</td>
      <td>${burstTimes[i]}</td>
      <td>${finishTimes[i]}</td>
      <td>${finishTimes[i] - at}</td>
      <td>${Math.max(0, finishTimes[i] - at - burstTimes[i])}</td>
    </tr>
  `).join("");
}

function generateTableFooter(arrivalTimes, finishTimes, totalWaitingTime) {
  const totalTurnaroundTime = finishTimes.reduce((acc, ft, i) => acc + (ft - arrivalTimes[i]), 0);
  const averageTurnaroundTime = totalTurnaroundTime / arrivalTimes.length;
  const averageWaitingTime = totalWaitingTime / arrivalTimes.length;

  return `
    <tr>
      <td colspan="4"><b>Average</b></td>
      <td>${averageTurnaroundTime.toFixed(2)}</td>
      <td>${averageWaitingTime.toFixed(2)}</td>
    </tr>
  `;
}

function isValidTimeQuantum(timeQuantum) {
  if (timeQuantum === null || timeQuantum === "") {
    alert("Time quantum cannot be empty.");
    return false;
  }
  if (isNaN(timeQuantum) || parseInt(timeQuantum) <= 0) {
    alert("Please enter a valid time quantum.");
    return false;
  }
  return true;
}

function fcfs(arrivalTimes, burstTimes) {
  let finishTimes = [];
  let currentTime = 0;
  let totalWaitingTime = 0;

  for (let i = 0; i < arrivalTimes.length; i++) {
    const finishTime = Math.max(currentTime, arrivalTimes[i]) + burstTimes[i];
    finishTimes.push(finishTime);
    totalWaitingTime += Math.max(0, currentTime - arrivalTimes[i]);
    currentTime = finishTime;
  }

  return { finishTimes, totalWaitingTime };
}

function sjf(arrivalTimes, burstTimes) {
  const jobs = arrivalTimes.map((at, i) => ({
    index: i,
    burstTime: burstTimes[i],
    arrivalTime: at,
  })).sort((a, b) => a.arrivalTime - b.arrivalTime);

  let finishTimes = new Array(arrivalTimes.length).fill(0);
  let currentTime = 0;
  let totalWaitingTime = 0;

  while (jobs.length > 0) {
    const availableJobs = jobs.filter(job => job.arrivalTime <= currentTime);
    if (availableJobs.length === 0) {
      currentTime++;
      continue;
    }

    availableJobs.sort((a, b) => a.burstTime - b.burstTime);
    const shortestJob = availableJobs.shift();
    const jobIndex = shortestJob.index;

    finishTimes[jobIndex] = currentTime + shortestJob.burstTime;
    totalWaitingTime += currentTime - shortestJob.arrivalTime;
    currentTime = finishTimes[jobIndex];

    jobs.splice(jobs.indexOf(shortestJob), 1);
  }

  return { finishTimes, totalWaitingTime };
}

function srtf(arrivalTimes, burstTimes) {
  const jobs = arrivalTimes.map((at, i) => ({
    index: i,
    burstTime: burstTimes[i],
    remainingBurstTime: burstTimes[i],
    arrivalTime: at,
  })).sort((a, b) => a.arrivalTime - b.arrivalTime);

  let finishTimes = new Array(arrivalTimes.length).fill(0);
  let currentTime = 0;
  let totalWaitingTime = 0;
  let completedJobs = 0;

  while (completedJobs < arrivalTimes.length) {
    const availableJobs = jobs.filter(job => job.arrivalTime <= currentTime && job.remainingBurstTime > 0);
    if (availableJobs.length === 0) {
      currentTime++;
      continue;
    }

    availableJobs.sort((a, b) => a.remainingBurstTime - b.remainingBurstTime);
    const shortestJob = availableJobs[0];
    const jobIndex = shortestJob.index;

    finishTimes[jobIndex] = currentTime + 1;
    shortestJob.remainingBurstTime--;

    if (shortestJob.remainingBurstTime === 0) {
      totalWaitingTime += currentTime - shortestJob.arrivalTime - shortestJob.burstTime;
      completedJobs++;
    }

    currentTime++;
  }

  return { finishTimes, totalWaitingTime };
}

function rr(arrivalTimes, burstTimes, timeQuantum) {
  const processes = arrivalTimes.map((at, i) => ({
    index: i,
    arrivalTime: at,
    burstTime: burstTimes[i],
    remainingBurstTime: burstTimes[i],
  })).sort((a, b) => a.arrivalTime - b.arrivalTime);

  let finishTimes = new Array(arrivalTimes.length).fill(0);
  let currentTime = 0;
  let totalWaitingTime = 0;
  let queue = [];

  while (processes.length > 0 || queue.length > 0) {
    while (processes.length > 0 && processes[0].arrivalTime <= currentTime) {
      queue.push(processes.shift());
    }

    if (queue.length === 0) {
      currentTime++;
      continue;
    }

    const currentProcess = queue.shift();
    const timeSlice = Math.min(currentProcess.remainingBurstTime, timeQuantum);
    currentProcess.remainingBurstTime -= timeSlice;
    currentTime += timeSlice;

    if (currentProcess.remainingBurstTime > 0) {
      queue.push(currentProcess);
    } else {
      finishTimes[currentProcess.index] = currentTime;
      totalWaitingTime += currentTime - currentProcess.arrivalTime - currentProcess.burstTime;
    }
  }

  return { finishTimes, totalWaitingTime };
}
