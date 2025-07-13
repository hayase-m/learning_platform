import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '../api'
import { auth } from '../firebase'

export default function CurriculumRadialMap({ curriculum, progress = [], onProgressUpdate, onDaySelect }) {
  const [time, setTime] = useState(0)
  const dimensions = { width: 600, height: 600 }

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 0.01)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const nodes = useMemo(() => {
    if (!curriculum?.curriculum_data?.daily_plan) return []

    const { width, height } = dimensions
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) / 2 - 40

    const dailyPlan = curriculum.curriculum_data.daily_plan.slice(1) // Skip day 1 (center node)
    const totalDays = dailyPlan.length
    const orbits = Math.ceil(totalDays / 4) // 3-4 nodes per orbit

    return dailyPlan.map((day, index) => {
      const orbitIndex = Math.floor(index / 4)
      const nodeIndexInOrbit = index % 4
      const orbitRadius = 100 + orbitIndex * 60

      // Different orbital speeds for each orbit (inner orbits faster)
      const orbitSpeed = 1 / (orbitIndex + 1)
      const orbitRotation = orbitIndex * (Math.PI / 6)
      const angle = (2 * Math.PI * nodeIndexInOrbit) / 4 + orbitRotation + (time * orbitSpeed)

      const dayProgress = progress.find(p => p.day === day.day)
      const isCompleted = dayProgress?.completed || false

      return {
        id: day.day,
        title: day.title,
        objectives: day.objectives,
        activities: day.activities,
        x: centerX + orbitRadius * Math.cos(angle),
        y: centerY + orbitRadius * Math.sin(angle),
        completed: isCompleted
      }
    })
  }, [curriculum, progress, dimensions, time])

  const orbits = useMemo(() => {
    if (!curriculum?.curriculum_data?.daily_plan) return []
    const totalDays = curriculum.curriculum_data.daily_plan.length - 1 // Exclude day 1
    const orbitCount = Math.ceil(totalDays / 4)
    const { width, height } = dimensions
    const centerX = width / 2
    const centerY = height / 2

    return Array.from({ length: orbitCount }, (_, i) => ({
      cx: centerX,
      cy: centerY,
      r: 100 + i * 60
    }))
  }, [curriculum, dimensions])

  if (!curriculum) {
    return (
      <Card className="bg-card border">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">カリキュラムを選択してください</p>
        </CardContent>
      </Card>
    )
  }

  const { width, height } = dimensions
  const centerX = width / 2
  const centerY = height / 2

  return (
    <div className="space-y-4">
      <Card className="bg-card border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="3" r="1" />
              <circle cx="12" cy="21" r="1" />
              <circle cx="3" cy="12" r="1" />
              <circle cx="21" cy="12" r="1" />
            </svg>
            カリキュラムマップ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <svg
              width={width}
              height={height}
              className="text-foreground"
            >
              {/* Orbit circles */}
              {orbits.map((orbit, i) => (
                <circle
                  key={i}
                  cx={orbit.cx}
                  cy={orbit.cy}
                  r={orbit.r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  opacity="0.2"
                />
              ))}

              {/* Center node - Day 1 */}
              {curriculum.curriculum_data.daily_plan[0] && (() => {
                const day1 = curriculum.curriculum_data.daily_plan[0]
                const day1Progress = progress.find(p => p.day === day1.day)
                const isCompleted = day1Progress?.completed || false

                return (
                  <>
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r="30"
                      fill={isCompleted ? 'rgb(6, 182, 212)' : 'rgb(107, 114, 128)'}
                      stroke="white"
                      strokeWidth="1"
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => onDaySelect?.(day1.day)}
                    />
                    <text
                      x={centerX}
                      y={centerY + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="10"
                      fontWeight="bold"
                      className="pointer-events-none"
                    >
                      Day {day1.day}
                    </text>
                  </>
                )
              })()}

              {/* Day nodes */}
              {nodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="25"
                    fill={node.completed ? 'rgb(6, 182, 212)' : 'rgb(107, 114, 128)'}
                    stroke="white"
                    strokeWidth="1"
                    className="cursor-pointer hover:opacity-80 transition-all"
                    onClick={() => onDaySelect?.(node.id)}
                  />
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="8"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    Day {node.id}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}