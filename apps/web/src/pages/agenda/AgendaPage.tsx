import { useState, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { EventDropArg, EventClickArg, DateSelectArg } from '@fullcalendar/core'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Topbar } from '@/components/layout/Topbar'
import { STATUS_CONSULTA, CALENDAR_COLORS } from '@/lib/constants'
import { AgendamentoModal } from './AgendamentoModal'

// ── Mock events ───────────────────────────────────────────────
const mockEvents = [
  {
    id: '1',
    title: 'Ana Lima – Consulta',
    start: new Date().toISOString().slice(0, 10) + 'T08:30:00',
    end:   new Date().toISOString().slice(0, 10) + 'T09:00:00',
    backgroundColor: CALENDAR_COLORS.confirmado,
    extendedProps: { status: 'confirmado', paciente: 'Ana Lima', tipo: 'Consulta' },
  },
  {
    id: '2',
    title: 'João Silva – Retorno',
    start: new Date().toISOString().slice(0, 10) + 'T09:00:00',
    end:   new Date().toISOString().slice(0, 10) + 'T09:30:00',
    backgroundColor: CALENDAR_COLORS.aguardando,
    extendedProps: { status: 'aguardando', paciente: 'João Silva', tipo: 'Retorno' },
  },
  {
    id: '3',
    title: 'Maria Costa – Teleconsulta',
    start: new Date().toISOString().slice(0, 10) + 'T10:00:00',
    end:   new Date().toISOString().slice(0, 10) + 'T10:30:00',
    backgroundColor: CALENDAR_COLORS.agendado,
    extendedProps: { status: 'agendado', paciente: 'Maria Costa', tipo: 'Teleconsulta' },
  },
  {
    id: '4',
    title: 'Pedro Alves – Urgência',
    start: new Date().toISOString().slice(0, 10) + 'T11:00:00',
    end:   new Date().toISOString().slice(0, 10) + 'T11:30:00',
    backgroundColor: CALENDAR_COLORS.em_atendimento,
    extendedProps: { status: 'em_atendimento', paciente: 'Pedro Alves', tipo: 'Urgência' },
  },
]

export default function AgendaPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [view, setView] = useState<string>('timeGridDay')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const handleDateSelect = (arg: DateSelectArg) => {
    setSelectedDate(arg.startStr)
    setSelectedEvent(null)
    setModalOpen(true)
  }

  const handleEventClick = (arg: EventClickArg) => {
    setSelectedEvent(arg.event)
    setModalOpen(true)
  }

  const handleEventDrop = (arg: EventDropArg) => {
    // TODO: call API to update event
    console.log('Event moved:', arg.event.id, arg.event.start)
  }

  const changeView = (v: string) => {
    setView(v)
    calendarRef.current?.getApi().changeView(v)
  }

  const goToday = () => calendarRef.current?.getApi().today()
  const goPrev  = () => calendarRef.current?.getApi().prev()
  const goNext  = () => calendarRef.current?.getApi().next()

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Agenda"
        subtitle="Visualize e gerencie os atendimentos"
        actions={
          <Button size="sm" onClick={() => { setSelectedEvent(null); setModalOpen(true) }}>
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        }
      />

      <div className="flex flex-col p-6 gap-4 flex-1 overflow-hidden">
        {/* Status legenda */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(STATUS_CONSULTA).map(([key, val]) => (
            <Badge key={key} variant="secondary" className={`${val.color} text-xs`}>
              <span className={`w-1.5 h-1.5 rounded-full ${val.dot}`} />
              {val.label}
            </Badge>
          ))}
        </div>

        {/* Calendar card */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-sm" onClick={goPrev}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={goToday}>Hoje</Button>
              <Button variant="ghost" size="icon-sm" onClick={goNext}><ChevronRight className="w-4 h-4" /></Button>
            </div>

            <div className="flex items-center gap-1">
              {[
                { v: 'timeGridDay',  label: 'Dia'    },
                { v: 'timeGridWeek', label: 'Semana' },
                { v: 'dayGridMonth', label: 'Mês'    },
                { v: 'listWeek',     label: 'Lista'  },
              ].map(({ v, label }) => (
                <Button
                  key={v}
                  size="sm"
                  variant={view === v ? 'default' : 'ghost'}
                  onClick={() => changeView(v)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="flex-1 overflow-auto p-4">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              locale={ptBrLocale}
              initialView={view}
              headerToolbar={false}
              events={mockEvents}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              slotMinTime="07:00:00"
              slotMaxTime="20:00:00"
              slotDuration="00:30:00"
              allDaySlot={false}
              nowIndicator={true}
              height="100%"
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventContent={(arg) => (
                <div className="px-1 py-0.5 overflow-hidden">
                  <p className="text-xs font-medium truncate">{arg.event.title}</p>
                </div>
              )}
            />
          </div>
        </Card>
      </div>

      <AgendamentoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        event={selectedEvent}
      />
    </div>
  )
}
