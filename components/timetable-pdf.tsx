"use client"

import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"
import type { TimetableForPDF, TimeSlotForPDF } from "@/lib/pdf-timetable"
import {
  extractTimeRanges,
  groupSlotsByDay,
  getSlotsForTime,
  generateFacultyLegend,
  formatTimeForPDF,
  isBreakSlot,
  formatSlotContent,
  formatDateForPDF,
  generateFacultyAbbreviation,
} from "@/lib/pdf-timetable"
import type { DayOfWeek } from "@/app/actions/timetables"

const styles = StyleSheet.create({
  page: {
    paddingTop: 8,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 4,
    alignItems: "center",
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 1,
    textAlign: "center",
  },
  description: {
    fontSize: 7,
    color: "#000000",
    textAlign: "center",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#000000",
    borderStyle: "solid",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    minHeight: 22,
  },
  dayCell: {
    width: "8%",
    borderRightWidth: 1,
    borderRightColor: "#000000",
    borderRightStyle: "solid",
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  dayText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  timeSlotCell: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: "#000000",
    borderRightStyle: "solid",
    padding: 1.5,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    minHeight: 22,
  },
  timeSlotHeader: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginBottom: 0.5,
  },
  cellContent: {
    fontSize: 6,
    color: "#000000",
    textAlign: "left",
    lineHeight: 1.1,
  },
  cellContentBold: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "left",
    lineHeight: 1.1,
  },
  breakText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
  },
  legendSection: {
    marginTop: 4,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "solid",
  },
  legendTitle: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 1,
  },
  legendItem: {
    fontSize: 6,
    color: "#000000",
    marginRight: 10,
    marginBottom: 0.5,
    width: "30%",
  },
  footer: {
    marginTop: 4,
    paddingTop: 2,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 6,
    color: "#000000",
  },
  footerItem: {
    flex: 1,
    textAlign: "center",
  },
})

interface TimetablePDFProps {
  timetable: TimetableForPDF
}

export function TimetablePDF({ timetable }: TimetablePDFProps) {
  const timeRanges = extractTimeRanges(timetable.slots)
  const slotsByDay = groupSlotsByDay(timetable.slots)
  const facultyLegend = generateFacultyLegend(timetable.slots)
  
  const dayOrder: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  const daysWithSlots = dayOrder.filter(day => {
    const slots = slotsByDay.get(day) || []
    return slots.length > 0
  })
  
  // Render table rows - one row per day
  const renderTableRows = () => {
    const rows: React.ReactNode[] = []
    
    daysWithSlots.forEach(day => {
      const daySlots = slotsByDay.get(day) || []
      
      // Create one row for this day
      const dayRow = (
        <View key={day} style={styles.tableRow}>
          <View style={styles.dayCell}>
            <Text style={styles.dayText}>{day.substring(0, 3).toUpperCase()}</Text>
          </View>
          {timeRanges.map((timeRange, idx) => {
            // Get all slots at this time for this day
            const slotsAtTime = daySlots.filter(
              slot =>
                slot.startTime === timeRange.startTime &&
                slot.endTime === timeRange.endTime
            )
            
            // Check if there's a break at this time
            const breakSlot = slotsAtTime.find(slot => isBreakSlot(slot.slotType.name))
            
            if (breakSlot) {
              // Show break in this cell
              return (
                <View key={idx} style={styles.timeSlotCell}>
                  <Text style={styles.breakText}>
                    {breakSlot.slotType.name.toUpperCase()}
                  </Text>
                </View>
              )
            }
            
            // Get regular (non-break) slots
            const regularSlotsAtTime = slotsAtTime.filter(slot => !isBreakSlot(slot.slotType.name))
            
            if (regularSlotsAtTime.length === 0) {
              return (
                <View key={idx} style={styles.timeSlotCell}>
                  {/* Empty cell */}
                </View>
              )
            }
            
            // Show regular slots
            return (
              <View key={idx} style={styles.timeSlotCell}>
                {regularSlotsAtTime.map((slot, slotIdx) => {
                  const content = formatSlotContent(slot)
                  return (
                    <View key={slot.id} style={{ marginBottom: slotIdx < regularSlotsAtTime.length - 1 ? 1.5 : 0 }}>
                      {content.map((line, lineIdx) => {
                        const isSubjectLine = lineIdx === 0
                        return (
                          <Text
                            key={lineIdx}
                            style={isSubjectLine ? styles.cellContentBold : styles.cellContent}
                          >
                            {line}
                          </Text>
                        )
                      })}
                    </View>
                  )
                })}
              </View>
            )
          })}
        </View>
      )
      rows.push(dayRow)
    })
    
    return rows
  }
  
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{timetable.name}</Text>
          {timetable.description && (
            <Text style={styles.description}>{timetable.description}</Text>
          )}
        </View>
        
        {/* Table */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableRow}>
            <View style={styles.dayCell}>
              <Text style={styles.dayText}>DAY</Text>
            </View>
            {timeRanges.map((timeRange, idx) => (
              <View key={idx} style={styles.timeSlotCell}>
                <Text style={styles.timeSlotHeader}>
                  {formatTimeForPDF(timeRange.startTime)}
                </Text>
                <Text style={styles.timeSlotHeader}>–</Text>
                <Text style={styles.timeSlotHeader}>
                  {formatTimeForPDF(timeRange.endTime)}
                </Text>
              </View>
            ))}
          </View>
          
          {/* Data Rows */}
          {renderTableRows()}
        </View>
        
        {/* Faculty Legend */}
        {facultyLegend.length > 0 && (
          <View style={styles.legendSection}>
            <Text style={styles.legendTitle}>Faculty Legend:</Text>
            <View style={styles.legendRow}>
              {facultyLegend.map((faculty, idx) => (
                <Text key={idx} style={styles.legendItem}>
                  {faculty.abbreviation} – {faculty.fullName}
                </Text>
              ))}
            </View>
          </View>
        )}
        
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text>Created by: {timetable.createdBy.name}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text>Created: {formatDateForPDF(timetable.createdAt)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

