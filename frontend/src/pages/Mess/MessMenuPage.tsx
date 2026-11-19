import React, { useEffect, useState } from 'react';
import { messApi } from '../../lib/api';
import { MessMenu } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, Edit3, Coffee, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';

export const MessMenuPage: React.FC = () => {
  const { role } = useAuth();
  const [menu, setMenu] = useState<MessMenu[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Day Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [targetDay, setTargetDay] = useState<MessMenu | null>(null);
  const [breakfast, setBreakfast] = useState('');
  const [lunch, setLunch] = useState('');
  const [snacks, setSnacks] = useState('');
  const [dinner, setDinner] = useState('');
  const [special, setSpecial] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const data = await messApi.getMenu();
      setMenu(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openEditModal = (day: MessMenu) => {
    setTargetDay(day);
    setBreakfast(day.breakfast);
    setLunch(day.lunch);
    setSnacks(day.snacks);
    setDinner(day.dinner);
    setSpecial(day.special_item || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDay) return;
    setIsSubmitting(true);
    try {
      await messApi.updateMenuDay(targetDay.day_of_week, {
        day_of_week: targetDay.day_of_week,
        breakfast,
        lunch,
        snacks,
        dinner,
        special_item: special
      });
      setIsEditOpen(false);
      await fetchMenu();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update mess menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-brand-700" />
            Weekly Mess & Dining Timetable
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Nutritional schedule across Breakfast (7:30–9:30 AM), Lunch (12:30–2:30 PM), Snacks (5:00–6:00 PM), and Dinner (7:30–9:30 PM)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="teal">Today is {currentDayName}</Badge>
        </div>
      </div>

      {/* 7-Day Timetable Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {menu.map((m) => {
          const isToday = m.day_of_week.toLowerCase() === currentDayName.toLowerCase();

          return (
            <Card key={m.id} className={isToday ? 'border-2 border-brand-600 shadow-md ring-1 ring-brand-100' : ''}>
              <CardHeader className="bg-slate-50/70 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{m.day_of_week}</h3>
                  {isToday && <Badge variant="emerald">Today's Meals</Badge>}
                </div>
                {['SUPER_ADMIN', 'WARDEN'].includes(role || '') && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[11px]"
                    icon={<Edit3 className="w-3 h-3" />}
                    onClick={() => openEditModal(m)}
                  >
                    Edit Menu
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                {/* Breakfast */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Coffee className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Breakfast:</span>
                    <p className="text-slate-600 mt-0.5">{m.breakfast}</p>
                  </div>
                </div>

                {/* Lunch */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded bg-sky-50 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Lunch:</span>
                    <p className="text-slate-600 mt-0.5">{m.lunch}</p>
                  </div>
                </div>

                {/* Evening Snacks */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Sunset className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Evening Snacks:</span>
                    <p className="text-slate-600 mt-0.5">{m.snacks}</p>
                  </div>
                </div>

                {/* Dinner */}
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Dinner:</span>
                    <p className="text-slate-600 mt-0.5">{m.dinner}</p>
                  </div>
                </div>

                {m.special_item && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-brand-800 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>Special: {m.special_item}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Edit Day Menu Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Update ${targetDay?.day_of_week} Mess Menu`}
        description="Set the meal plan items prepared by kitchen staff"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Breakfast (Morning)"
            value={breakfast}
            onChange={(e) => setBreakfast(e.target.value)}
            required
          />

          <Input
            label="Lunch (Afternoon)"
            value={lunch}
            onChange={(e) => setLunch(e.target.value)}
            required
          />

          <Input
            label="Evening Snacks"
            value={snacks}
            onChange={(e) => setSnacks(e.target.value)}
            required
          />

          <Input
            label="Dinner (Night)"
            value={dinner}
            onChange={(e) => setDinner(e.target.value)}
            required
          />

          <Input
            label="Chef's Special Delight / Sweet Dish"
            value={special}
            onChange={(e) => setSpecial(e.target.value)}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Menu
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
