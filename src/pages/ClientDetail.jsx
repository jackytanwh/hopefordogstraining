
import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from
"@/components/ui/alert-dialog";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  Phone,
  Calendar,
  PawPrint,
  FileText,
  Plus,
  Edit,
  AlertTriangle,
  Trash2
} from
"lucide-react";
import { format, parseISO } from "date-fns";

import ClientInfo from "../components/client/ClientInfo";
import TrainingProgress from "../components/client/TrainingProgress"; // This import will remain but the component will not be rendered.
import AddProgressNote from "../components/client/AddProgressNote";
import CurriculumTracker from "../components/client/CurriculumTracker";
import BasicMannersCurriculum from "../components/client/BasicMannersCurriculum";

const statusColors = {
  initial: "bg-blue-100 text-blue-800 border-blue-200",
  follow_up: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
  completed: "bg-purple-100 text-purple-800 border-purple-200",
  paused: "bg-gray-100 text-gray-800 border-gray-200"
};

export default function ClientDetail() {
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const loadClient = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const clients = await base44.entities.Client.list();
      const foundClient = clients.find((c) => c.id === clientId);
      setClient(foundClient);
    } catch (error) {
      console.error("Error loading client:", error);
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleAddNote = async (noteData) => {
    if (!client) return;

    const updatedNotes = [
      ...(client.training_notes || []),
      {
        ...noteData,
        date: new Date().toISOString().split('T')[0]
      }];


    await base44.entities.Client.update(client.id, {
      training_notes: updatedNotes
    });

    await loadClient();
    setShowAddNote(false);
  };

  const handleDeleteNote = async (noteIndex) => {
    if (!client || !client.training_notes) return;

    const updatedNotes = client.training_notes.filter((_, index) => index !== noteIndex);

    await base44.entities.Client.update(client.id, {
      training_notes: updatedNotes
    });

    await loadClient();
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!client) return;

    await base44.entities.Client.update(client.id, {
      training_status: newStatus
    });

    await loadClient();
  };

  const handleDeleteClient = async () => {
    if (!client) return;

    try {
      await base44.entities.Client.delete(client.id);
      const program = client?.program;
      if (program) {
        navigate(createPageUrl(`Dashboard?program=${program}`));
      } else {
        navigate(createPageUrl("Dashboard")); // Changed from "Clients" to "Dashboard" for consistency
      }
    } catch (error) {
      console.error("Error deleting client:", error);
    }
  };

  const handleBackClick = () => {
    const program = client?.program;
    
    if (program) {
      navigate(createPageUrl(`Dashboard?program=${program}`));
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-200 rounded"></div>
            <div className="h-8 bg-slate-200 rounded w-64"></div>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-slate-200 rounded-lg"></div>
              <div className="h-48 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-96 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>);

  }

  if (!client) {
    return (
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Client Not Found</h1>
        <Button onClick={() => navigate(createPageUrl("Dashboard"))}> {/* Changed from "Clients" to "Dashboard" */}
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>);

  }

  const programName = client.program === 'basic_manners' ? 'Basic Manners In-Home' :
  client.program === 'basic_manners_group' ? 'Basic Manners Group Program' :
  client.program === 'basic_manners_fyog' ? 'Basic Manners FYOG Program' :
  client.program === 'kinder_puppy' ? 'Kinder Puppy Program' :
  client.program === 'behavioural_modification' ? 'Behavioural Modification Program' : 'Unknown Program';

  return (
    <>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handleBackClick}
              className="hover:bg-slate-100">

              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{client.client_name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 text-slate-600">
                  <PawPrint className="w-4 h-4" />
                  <span className="font-medium">{client.dog_name}</span>
                </div>
                <Badge variant="outline">{programName}</Badge>
                <Badge
                  variant="secondary"
                  className={`${statusColors[client.training_status]} border font-medium`}>

                  {client.training_status.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAddNote(true)}
              className="hidden md:flex">

              <Plus className="w-4 h-4 mr-2" />
              Add Progress Note
            </Button>
            <Link to={createPageUrl(`EditClient?id=${client.id}`)}>
              <Button
                variant="outline"
                className="hidden md:flex">

                <Edit className="w-4 h-4 mr-2" />
                Edit Client
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)} className="bg-[#ff7a7a] text-slate-50 px-4 py-2 text-sm font-medium items-center justify-center gap-2 whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input h-10 hidden md:flex hover:bg-red-50 hover:text-red-700 hover:border-red-200">


              <Trash2 className="w-4 h-4 mr-2" />
              Delete Client
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ClientInfo client={client} onUpdate={loadClient} />

            {/* Mobile: Primary Concerns moved above Training Progress */}
            {client.primary_concerns &&
            <div className="md:hidden">
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="text-[#ffc83d] text-xl font-semibold tracking-tight flex items-center gap-2">
                      Primary Concerns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <p className="text-slate-600 whitespace-pre-wrap">
                      {client.primary_concerns}
                    </p>
                  </CardContent>
                </Card>
              </div>
            }
            
            {/* TrainingProgress component removed as per instructions */}

            {client.program === 'kinder_puppy' &&
            <CurriculumTracker
              client={client}
              onUpdate={loadClient} />

            }
            
            {client.program === 'basic_manners' &&
            <BasicMannersCurriculum
              client={client}
              onUpdate={loadClient} />

            }
          </div>
          
          <div className="space-y-6">
            {/* Desktop: Primary Concerns in sidebar */}
            {client.primary_concerns &&
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hidden md:block">
                <CardHeader className="border-b border-slate-100">
                  <CardTitle className="text-[#ffc83d] text-xl font-semibold tracking-tight flex items-center gap-2">
                    Primary Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-slate-600 whitespace-pre-wrap">
                    {client.primary_concerns}
                  </p>
                </CardContent>
              </Card>
            }
            
            {/* Mobile buttons */}
            <div className="md:hidden space-y-2">
              <Button
                onClick={() => setShowAddNote(true)}
                className="w-full">

                <Plus className="w-4 h-4 mr-2" />
                Add Progress Note
              </Button>
              <Link to={createPageUrl(`EditClient?id=${client.id}`)} className="w-full block">
                <Button
                  variant="outline"
                  className="w-full">

                  <Edit className="w-4 h-4 mr-2" />
                  Edit Client
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full hover:bg-red-50 hover:text-red-700 hover:border-red-200">

                <Trash2 className="w-4 h-4 mr-2" />
                Delete Client
              </Button>
            </div>
          </div>
        </div>

        <AddProgressNote
          isOpen={showAddNote}
          onClose={() => setShowAddNote(false)}
          onSubmit={handleAddNote} />

      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {client?.client_name} and {client?.dog_name}? 
              This action cannot be undone and will permanently remove all client data, including training notes and consultation history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-red-600 hover:bg-red-700">

              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);

}
